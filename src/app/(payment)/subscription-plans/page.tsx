"use client";
import React, { useState, useEffect } from "react";
import {
  subscriptionApiClient,
  SubscriptionPlan,
} from "@/infrastructure/subscription/subscriptionAPIClient";

import Button from "@/components/ui/Button";
import { ToastContainer, toast } from "react-toastify";
import { Crown, Check, Loader2 } from "lucide-react";
import { user_role } from "@/constants/role";

import { useSubscriptionGuard } from "@/hooks/payment/useSubscriptionGuard";

const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasActiveSubscription, loading: guardLoading } = useSubscriptionGuard(false);
  const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null;

  // Redirect to dashboard if already subscribed
  useEffect(() => {
    if (!guardLoading && hasActiveSubscription && router) {
      console.log("🔄 [DEBUG] User has active subscription, redirecting to dashboard");
      router.replace("/");
    }
  }, [guardLoading, hasActiveSubscription, router]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await subscriptionApiClient.getSubscriptionPlans();
        // Map backend fields to frontend SubscriptionPlan interface
        const mappedPlans = response.results.map((plan: any) => ({
          uid: plan.id?.toString() ?? '',
          name: plan.name,
          description: plan.description || '',
          amount_jpy: Number(plan.amount) || 0,
          billing_interval: plan.period === 'monthly' ? 'month' : plan.period === 'semiannually' ? 'six_months' : plan.period,
          billing_interval_label: plan.period === 'monthly' ? '月' : plan.period === 'semiannually' ? '6ヶ月' : plan.period,
          is_active: plan.is_active,
          // Store original period for backend API calls
          original_period: plan.period
        }));
        setPlans(mappedPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("プランの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);


  // Simple and reliable script loader
  const loadUnivapayScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      // Check if already loaded - try multiple possible global names
      const possibleGlobals = ['Univapay', 'UnivapayCheckout', 'UnivaPay', 'univapay', 'GopayCheckout'];
      for (const globalName of possibleGlobals) {
        if ((window as any)[globalName]) {
          console.log(`[UnivaPay] Found global: ${globalName}`);
          (window as any).Univapay = (window as any)[globalName];
          resolve();
          return;
        }
      }

      // Check if script exists
      const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
      if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
          resolve();
          return;
        }
        // Wait for existing script
        existingScript.addEventListener('load', () => {
          existingScript.dataset.loaded = 'true';
          resolve();
        });
        existingScript.addEventListener('error', reject);
        return;
      }

      // Create and load new script
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.defer = false;
      script.dataset.loaded = 'false';

      script.onload = () => {
        console.log('[UnivaPay] Script loaded');
        script.dataset.loaded = 'true';

        // Give it a moment for the global to be set
        setTimeout(() => {
          // Check multiple possible global names
          const possibleGlobals = ['Univapay', 'UnivapayCheckout', 'UnivaPay', 'univapay', 'GopayCheckout'];
          for (const globalName of possibleGlobals) {
            if ((window as any)[globalName]) {
              console.log(`[UnivaPay] Found global after load: ${globalName}`);
              (window as any).Univapay = (window as any)[globalName];
              resolve();
              return;
            }
          }

          console.error('[UnivaPay] Global not found, checking all window properties...');
          const allGlobals = Object.keys(window).filter(key =>
            key.toLowerCase().includes('univa') ||
            key.toLowerCase().includes('widget') ||
            key.toLowerCase().includes('checkout') ||
            key.toLowerCase().includes('gopay')
          );
          console.log('[UnivaPay] Possible globals:', allGlobals);
          reject(new Error(`UnivaPay global not found. Available: ${allGlobals.join(', ')}`));
        }, 200);
      };

      script.onerror = (e) => {
        console.error('[UnivaPay] Script load error:', e);
        reject(new Error('Failed to load UnivaPay script'));
      };

      document.head.appendChild(script);
    });
  };

  // Univapay widget integration

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Prevent subscription if user already has active subscription
    if (hasActiveSubscription) {
      toast.error("既にアクティブなサブスクリプションがあります");
      return;
    }

    setSubscribing(plan.uid);
    try {
      console.log('[UnivaPay] Fetching widget config...');
      const widgetConfigRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://15.206.185.80"}/payment/widget-config/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      console.log('[UnivaPay] Widget config response status:', widgetConfigRes.status);

      if (!widgetConfigRes.ok) {
        throw new Error("Failed to fetch UnivaPay widget config");
      }

      const widgetConfig = await widgetConfigRes.json();
      console.log('[UnivaPay] Widget config received:', widgetConfig);

      if (!widgetConfig.widget_url || !widgetConfig.app_token || !widgetConfig.store_id) {
        throw new Error("Incomplete widget configuration received");
      }

      // Load script and wait for global
      console.log('[UnivaPay] Loading script from:', widgetConfig.widget_url);
      await loadUnivapayScript(widgetConfig.widget_url);

      // Use the original period from backend for API call - DECLARE EARLY
      const backendPeriod = (plan as any).original_period || plan.billing_interval;
      console.log("[UnivaPay] Using period for backend:", backendPeriod);

      // 3. Open the UnivaPay widget and get transaction_token_id via callback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const openWidgetAndGetToken = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          // Use the correct global name
          const UnivapayGlobal = (window as any).Univapay || (window as any).UnivapayCheckout;

          if (!UnivapayGlobal) {
            reject(new Error('UnivaPay widget not available'));
            return;
          }

          console.log('[UnivaPay] Using global:', UnivapayGlobal);
          console.log('[UnivaPay] Available methods:', Object.keys(UnivapayGlobal));
          console.log('[UnivaPay] Global type:', typeof UnivapayGlobal);
          console.log('[UnivaPay] Global prototype:', UnivapayGlobal.prototype ? Object.keys(UnivapayGlobal.prototype) : 'No prototype');

          // Try different widget creation methods
          let widget;
          try {
            // Method 1: Try create() method
            if (typeof UnivapayGlobal.create === 'function') {
              console.log('[UnivaPay] Using create() method');

              // Define widget configs outside try-catch
              const widgetConfigAppId = {
                appId: widgetConfig.app_token,  // Try appId first
                storeId: widgetConfig.store_id,
                amount: plan.amount_jpy,
                currency: "JPY",
                subscription: true,
                recurring: true,
                recurring_type: "subscription",
                tokenType: "subscription",
                checkout: "token",
                interval: backendPeriod === "monthly" ? "month" : backendPeriod === "semiannually" ? "month" : backendPeriod,
                interval_count: backendPeriod === "semiannually" ? 6 : 1,
                period: backendPeriod,
                metadata: { planId: plan.uid, planName: plan.name },
                onSuccess: (result: any) => {
                  // Print the full result object for debugging
                  console.log("[UnivaPay] Widget onSuccess result (full):", result);

                  // Check for subscription token indicators
                  if (!result || (!result.tokenId && !result.transactionTokenId && !result.transaction_token_id && !result.id)) {
                    console.warn("[UnivaPay] No token ID found in result:", result);
                    reject(new Error("No token ID received from widget"));
                    return;
                  }

                  // Warn if the result does not look like a subscription token
                  if (!result.type && !result.mode && !result.subscription && !result.recurring && !result.recurring_type) {
                    console.warn("[UnivaPay] Result does not appear to be a subscription token. This may cause NOT_SUBSCRIPTION_TOKEN error.", result);
                  }

                  // Handle different possible token property names
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  console.log("[UnivaPay] Extracted token ID:", tokenId);
                  resolve(tokenId);
                },
                onError: (err: any) => {
                  console.error("[UnivaPay] Widget error:", err);
                  reject(err);
                },
                onClose: () => {
                  console.warn("[UnivaPay] Widget closed by user");
                  reject(new Error("Widget closed by user"));
                },
              };

              const widgetConfigAppToken = {
                appToken: widgetConfig.app_token,  // Try appToken as fallback
                storeId: widgetConfig.store_id,
                amount: plan.amount_jpy,
                currency: "JPY",
                subscription: true,
                recurring: true,
                recurring_type: "subscription",
                tokenType: "subscription",
                checkout: "token",
                interval: backendPeriod === "monthly" ? "month" : backendPeriod === "semiannually" ? "month" : backendPeriod,
                interval_count: backendPeriod === "semiannually" ? 6 : 1,
                period: backendPeriod,
                metadata: { planId: plan.uid, planName: plan.name },
                onSuccess: (result: any) => {
                  console.log("[UnivaPay] Widget success, token:", result);

                  // Handle different possible token property names
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  console.log("[UnivaPay] Extracted token ID:", tokenId);

                  if (!tokenId) {
                    console.error("[UnivaPay] No token ID found in result:", result);
                    reject(new Error("No token ID received from widget"));
                    return;
                  }

                  resolve(tokenId);
                },
                onError: (err: any) => {
                  console.error("[UnivaPay] Widget error:", err);
                  reject(err);
                },
                onClose: () => {
                  console.warn("[UnivaPay] Widget closed by user");
                  reject(new Error("Widget closed by user"));
                },
              };

              try {
                console.log('[UnivaPay] Trying with appId parameter');
                console.log('[UnivaPay] Widget config:', widgetConfigAppId);
                widget = UnivapayGlobal.create(widgetConfigAppId);
                console.log('[UnivaPay] Widget created successfully with appId');
              } catch (error1) {
                console.log('[UnivaPay] appId failed, trying appToken parameter');
                console.log('[UnivaPay] Widget config:', widgetConfigAppToken);
                try {
                  widget = UnivapayGlobal.create(widgetConfigAppToken);
                  console.log('[UnivaPay] Widget created successfully with appToken');
                } catch (error2) {
                  console.error('[UnivaPay] Both parameter names failed:', error1, error2);
                  reject(new Error(`Widget creation failed with both appId and appToken parameters`));
                  return;
                }
              }
            }
            // Method 2: Try new Widget() constructor
            else if (UnivapayGlobal.Widget) {
              console.log('[UnivaPay] Using Widget constructor');

              const widgetConfigConstructor = {
                appId: widgetConfig.app_token,  // Use appId as primary
                storeId: widgetConfig.store_id,
                amount: plan.amount_jpy,
                currency: "JPY",
                subscription: true,
                recurring: true,
                recurring_type: "subscription",
                tokenType: "subscription",
                checkout: "token",
                interval: backendPeriod === "monthly" ? "month" : backendPeriod === "semiannually" ? "month" : backendPeriod,
                interval_count: backendPeriod === "semiannually" ? 6 : 1,
                period: backendPeriod,
                metadata: { planId: plan.uid, planName: plan.name },
                onSuccess: (result: any) => {
                  console.log("[UnivaPay] Widget success, token:", result);

                  // Handle different possible token property names
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  console.log("[UnivaPay] Extracted token ID:", tokenId);

                  if (!tokenId) {
                    console.error("[UnivaPay] No token ID found in result:", result);
                    reject(new Error("No token ID received from widget"));
                    return;
                  }

                  resolve(tokenId);
                },
                onError: (err: any) => {
                  console.error("[UnivaPay] Widget error:", err);
                  reject(err);
                },
                onClose: () => {
                  console.warn("[UnivaPay] Widget closed by user");
                  reject(new Error("Widget closed by user"));
                },
              };

              widget = new UnivapayGlobal.Widget(widgetConfigConstructor);
            }
            // Method 3: Try direct instantiation
            else {
              console.log('[UnivaPay] Trying direct instantiation');

              const widgetConfigDirect = {
                appId: widgetConfig.app_token,  // Use appId as primary
                storeId: widgetConfig.store_id,
                amount: plan.amount_jpy,
                currency: "JPY",
                subscription: true,
                recurring: true,
                recurring_type: "subscription",
                tokenType: "subscription",
                checkout: "token",
                interval: backendPeriod === "monthly" ? "month" : backendPeriod === "semiannually" ? "month" : backendPeriod,
                interval_count: backendPeriod === "semiannually" ? 6 : 1,
                period: backendPeriod,
                metadata: { planId: plan.uid, planName: plan.name },
                onSuccess: (result: any) => {
                  console.log("[UnivaPay] Widget success, token:", result);

                  // Handle different possible token property names
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  console.log("[UnivaPay] Extracted token ID:", tokenId);

                  if (!tokenId) {
                    console.error("[UnivaPay] No token ID found in result:", result);
                    reject(new Error("No token ID received from widget"));
                    return;
                  }

                  resolve(tokenId);
                },
                onError: (err: any) => {
                  console.error("[UnivaPay] Widget error:", err);
                  reject(err);
                },
                onClose: () => {
                  console.warn("[UnivaPay] Widget closed by user");
                  reject(new Error("Widget closed by user"));
                },
              };

              widget = new UnivapayGlobal(widgetConfigDirect);
            }

            // Open the widget
            if (widget && typeof widget.open === 'function') {
              console.log('[UnivaPay] Opening widget');
              widget.open();
            } else {
              reject(new Error('Widget created but no open method available'));
            }

          } catch (error) {
            console.error('[UnivaPay] Widget creation error:', error);
            reject(error);
          }
        });
      };

      const transaction_token_id = await openWidgetAndGetToken();
      if (!transaction_token_id) {
        throw new Error("No transaction_token_id provided");
      }

      const successUrl = `${window.location.origin}/subscription-success`;
      const cancelUrl = `${window.location.origin}/subscription-plans`;

      // backendPeriod is already declared above
      console.log("[UnivaPay] Using period for backend:", backendPeriod);

      // 4. Call backend with correct token, amount, and period
      console.log("[UnivaPay] Calling backend API with:", {
        transaction_token_id: "***",
        amount: plan.amount_jpy,
        period: backendPeriod,
        successUrl,
        cancelUrl
      });

      const response = await subscriptionApiClient.createCheckoutSession(
        transaction_token_id,
        plan.amount_jpy,
        backendPeriod,
        successUrl,
        cancelUrl
      );

      // Store session ID for later confirmation
      if (response.session_id) {
        localStorage.setItem("checkout_session_id", response.session_id);
      }

      // Check if payment was successful and redirect accordingly
      if (response.ok && response.payment) {
        console.log("[UnivaPay] Payment processed successfully, redirecting to success page");
        // Redirect to success page since payment was completed
        window.location.href = successUrl;
      } else if (response.checkout_url) {
        // Fallback to checkout URL if available
        window.location.href = response.checkout_url;
      } else {
        console.error("[UnivaPay] No checkout_url in response:", response);
        toast.error("支払いページのURLが取得できませんでした (No checkout URL received)");
        setSubscribing(null);
      }
    } catch (error: any) {
      console.error("Subscription failed:", error);
      toast.error(error.message || "サブスクリプションの作成に失敗しました");
      setSubscribing(null);
    }
  };




  return (
    <div className="min-h-screen main_gradient_bg text-white">
      <ToastContainer />
      {loading || guardLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-white" size={24} />
          <span className="ml-2">プランを読み込み中...</span>
        </div>
      ) : hasActiveSubscription ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="animate-spin text-white mx-auto mb-4" size={32} />
            <p className="text-white">ダッシュボードに移動中...</p>
          </div>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Crown className="text-yellow-400 mr-2" size={32} />
              <h1 className="text-4xl text-white font-bold">プレミアムプラン</h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              最高の体験を得るために、プレミアムプランにアップグレードしてください
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.uid}
                className="glass-card rounded-xl p-8 relative overflow-hidden border border-white/20"
              >
                {plan.billing_interval === "six_months" && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                    人気
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl text-white font-bold mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-300 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl text-blue-400 font-bold">
                      ¥{plan.amount_jpy.toLocaleString()}
                    </span>
                    <span className="text-gray-400 ml-2">
                      / {plan.billing_interval_label}
                    </span>
                  </div>

                  <div className="text-sm text-gray-400 mb-6">
                    {plan.billing_interval === "six_months" && (
                      <span>
                        月額 ¥{Math.round(plan.amount_jpy / 6).toLocaleString()}
                      </span>
                    )}
                    {plan.billing_interval === "month" && (
                      <span>月額 ¥{plan.amount_jpy.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-blue-300 mb-8">
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-3" size={20} />
                    <span>プレミアム機能へのフルアクセス</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-3" size={20} />
                    <span>優先サポート</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-3" size={20} />
                    <span>広告なし体験</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-3" size={20} />
                    <span>高品質コンテンツ</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  loading={subscribing === plan.uid}
                  variant="glassBrand"
                  disabled={subscribing !== null}
                >
                  {subscribing === plan.uid ? "処理中..." : "プランを選択"}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl text-white font-bold text-center mb-8">
              よくある質問
            </h2>
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-400">
                  いつでもキャンセルできますか？
                </h3>
                <p className="text-gray-300">
                  はい、いつでもキャンセルできます。請求期間の終了時にサブスクリプションが終了します。
                </p>
              </div>
              <div className="glass-card p-6 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-400">
                  支払い方法は何ですか？
                </h3>
                <p className="text-gray-300">
                  UnivaPayを通じてクレジットカードでお支払いいただけます。安全で確実な決済システムです。
                </p>
              </div>
              <div className="glass-card p-6 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-400">
                  プランは変更できますか？
                </h3>
                <p className="text-gray-300">
                  現在のプランをキャンセルして、新しいプランに再登録していただく必要があります。
                </p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default SubscriptionPlansPage;
