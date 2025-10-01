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
import { useRouter } from "next/navigation";

const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasActiveSubscription, loading: guardLoading } = useSubscriptionGuard(false);
  const router = useRouter();

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
      // 1. Create subscription order first
      const backendPeriod = (plan as any).original_period || plan.billing_interval;
      const order = await subscriptionApiClient.createSubscriptionOrder(plan.uid, backendPeriod);
      if (!order?.id) {
        throw new Error("注文の作成に失敗しました (Failed to create order)");
      }

      // 2. Fetch widget config
      const widgetConfigRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://prod-be.examplesite.jp"}/payment/widget-config/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!widgetConfigRes.ok) {
        throw new Error("Failed to fetch UnivaPay widget config");
      }
      const widgetConfig = await widgetConfigRes.json();
      if (!widgetConfig.widget_url || !widgetConfig.app_token || !widgetConfig.store_id) {
        throw new Error("Incomplete widget configuration received");
      }

      // 3. Load UnivaPay script
      await loadUnivapayScript(widgetConfig.widget_url);

      // 4. Open widget and get transaction token
      const openWidgetAndGetToken = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const UnivapayGlobal = (window as any).Univapay || (window as any).UnivapayCheckout;
          if (!UnivapayGlobal) {
            reject(new Error('UnivaPay widget not available'));
            return;
          }
          let widget;
          try {
            if (typeof UnivapayGlobal.create === 'function') {
              const widgetConfigAppId = {
                appId: widgetConfig.app_token,
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
                metadata: { order_id: order.id, planName: plan.name },
                onSuccess: (result: any) => {
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  if (!tokenId) {
                    reject(new Error("No token ID received from widget"));
                    return;
                  }
                  resolve(tokenId);
                },
                onError: (err: any) => reject(err),
                onClose: () => reject(new Error("Widget closed by user")),
              };
              const widgetConfigAppToken = {
                appToken: widgetConfig.app_token,
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
                metadata: { order_id: order.id, planName: plan.name },
                onSuccess: (result: any) => {
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  if (!tokenId) {
                    reject(new Error("No token ID received from widget"));
                    return;
                  }
                  resolve(tokenId);
                },
                onError: (err: any) => reject(err),
                onClose: () => reject(new Error("Widget closed by user")),
              };
              try {
                widget = UnivapayGlobal.create(widgetConfigAppId);
              } catch (error1) {
                try {
                  widget = UnivapayGlobal.create(widgetConfigAppToken);
                } catch (error2) {
                  reject(new Error(`Widget creation failed with both appId and appToken parameters`));
                  return;
                }
              }
            } else if (UnivapayGlobal.Widget) {
              const widgetConfigConstructor = {
                appId: widgetConfig.app_token,
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
                metadata: { order_id: order.id, planName: plan.name },
                onSuccess: (result: any) => {
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  if (!tokenId) {
                    reject(new Error("No token ID received from widget"));
                    return;
                  }
                  resolve(tokenId);
                },
                onError: (err: any) => reject(err),
                onClose: () => reject(new Error("Widget closed by user")),
              };
              widget = new UnivapayGlobal.Widget(widgetConfigConstructor);
            } else {
              const widgetConfigDirect = {
                appId: widgetConfig.app_token,
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
                metadata: { order_id: order.id, planName: plan.name },
                onSuccess: (result: any) => {
                  const tokenId = result.tokenId || result.transactionTokenId || result.transaction_token_id || result.id;
                  if (!tokenId) {
                    reject(new Error("No token ID received from widget"));
                    return;
                  }
                  resolve(tokenId);
                },
                onError: (err: any) => reject(err),
                onClose: () => reject(new Error("Widget closed by user")),
              };
              widget = new UnivapayGlobal(widgetConfigDirect);
            }
            if (widget && typeof widget.open === 'function') {
              widget.open();
            } else {
              reject(new Error('Widget created but no open method available'));
            }
          } catch (error) {
            reject(error);
          }
        });
      };
      const transaction_token_id = await openWidgetAndGetToken();
      if (!transaction_token_id) {
        throw new Error("No transaction_token_id provided");
      }

      // 5. Call backend with correct token, amount, period, and orderId
      const successUrl = `${window.location.origin}/subscription-success`;
      const cancelUrl = `${window.location.origin}/subscription-plans`;
      const response = await subscriptionApiClient.createCheckoutSession(
        transaction_token_id,
        plan.amount_jpy,
        backendPeriod,
        order.code,
        successUrl,
        cancelUrl
      );
      if (response.session_id) {
        localStorage.setItem("checkout_session_id", response.session_id);
      }
      if (response.ok && response.payment) {
        window.location.href = successUrl;
      } else if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        toast.error("支払いページのURLが取得できませんでした (No checkout URL received)");
        setSubscribing(null);
      }
    } catch (error: any) {
      toast.error(error.message || "サブスクリプションの作成に失敗しました");
      setSubscribing(null);
    }
  };

  return (
    <div>
      {loading ? (
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
      <ToastContainer />
    </div>
  );
}

export default SubscriptionPlansPage;
