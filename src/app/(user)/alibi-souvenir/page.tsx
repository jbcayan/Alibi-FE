"use client";
import React, { useEffect, useState, useRef } from "react";

// Extend window type for UnivapayCheckout
declare global {
  interface Window {
    UnivapayCheckout?: any;
  }
}
import Menu from "@/components/home/Menu";
import { userApiClient } from "@/infrastructure/user/userAPIClient";
import {
  GalleryItem,
  UserSouvenirRequestResponse,
} from "@/infrastructure/user/utils/types";
import Button from "@/components/ui/Button";
import { FiDownload } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { baseUrl } from "@/constants/baseApi";
import {
  ClipboardList,
  AlertCircle,
  Image,
  Hash,
  Package,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";

const AlibiSouvenir = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderModal, setOrderModal] = useState<GalleryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [souvenirRequests, setSouvenirRequests] = useState<
    UserSouvenirRequestResponse[]
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestPage, setRequestPage] = useState(1);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  // Widget config and script loading state
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const widgetScriptRef = useRef<HTMLScriptElement | null>(null);

  // Robust UnivaPay script loader (from subscription flow)
  const loadUnivapayScript = (src: string): Promise<void> => {
    console.log('[Souvenir] loadUnivapayScript called with src:', src);
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        console.log('[Souvenir] Window undefined, resolving');
        resolve();
        return;
      }
      // Check if already loaded
      const possibleGlobals = ["Univapay", "UnivapayCheckout", "UnivaPay", "univapay", "GopayCheckout"];
      for (const globalName of possibleGlobals) {
        if ((window as any)[globalName]) {
          console.log('[Souvenir] Found existing global:', globalName);
          (window as any).Univapay = (window as any)[globalName];
          resolve();
          return;
        }
      }
      console.log('[Souvenir] No existing global found, checking for existing script');
      // Check if script exists
      const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
      if (existingScript) {
        console.log('[Souvenir] Found existing script, checking if loaded');
        if (existingScript.dataset.loaded === "true") {
          console.log('[Souvenir] Existing script already loaded');
          resolve();
          return;
        }
        console.log('[Souvenir] Waiting for existing script to load');
        existingScript.addEventListener("load", () => {
          existingScript.dataset.loaded = "true";
          console.log('[Souvenir] Existing script loaded');
          resolve();
        });
        existingScript.addEventListener("error", (e) => {
          console.error('[Souvenir] Existing script error:', e);
          reject(e);
        });
        return;
      }
      console.log('[Souvenir] Creating new script element');
      // Create and load new script
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.defer = false;
      script.dataset.loaded = "false";
      script.onload = () => {
        console.log('[Souvenir] Script loaded, checking for global');
        script.dataset.loaded = "true";
        setTimeout(() => {
          for (const globalName of possibleGlobals) {
            if ((window as any)[globalName]) {
              console.log('[Souvenir] Found global after load:', globalName);
              (window as any).Univapay = (window as any)[globalName];
              resolve();
              return;
            }
          }
          console.error('[Souvenir] Global not found after script load, available globals:', Object.keys(window).filter(key => key.toLowerCase().includes('univa') || key.toLowerCase().includes('checkout')));
          reject(new Error("UnivaPay global not found after script load"));
        }, 200);
      };
      script.onerror = (e) => {
        console.error('[Souvenir] Script load error:', e);
        reject(new Error("Failed to load UnivaPay script"));
      };
      console.log('[Souvenir] Appending script to head');
      document.head.appendChild(script);
    });
  };
  const REQUESTS_PER_PAGE = 6;
  const totalPages = Math.ceil(souvenirRequests.length / REQUESTS_PER_PAGE);
  const paginatedRequests = souvenirRequests.slice(
    (requestPage - 1) * REQUESTS_PER_PAGE,
    requestPage * REQUESTS_PER_PAGE
  );

  const fetchGallery = async () => {
    try {
      const res = await userApiClient.getGalleryPhotos();
      setGalleryItems(res.results || []);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSouvenirRequests = async () => {
    setLoadingRequests(true);
    setRequestError(null);
    try {
      const data = await userApiClient.getUserSouvenirRequests();
      setSouvenirRequests(
        Array.isArray(data)
          ? data
          : data && Array.isArray((data as any).results)
          ? (data as any).results
          : []
      );
    } catch (err: any) {
      setRequestError(err.message || "依頼一覧の取得に失敗しました");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Generate unique order ID
  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `GL-TTSC-${timestamp}${random}`;
  };

  // Make debug function available globally for console testing
  useEffect(() => {
    // Add a test function for the widget config endpoint
    (window as any).testWidgetConfig = async () => {
      const token = localStorage.getItem("accessToken");
      const baseUrl = "https://prod-be.examplesite.jp";
      console.log('Testing widget config endpoint...');
      console.log('URL:', `${baseUrl}/payment/widget-config/`);
      console.log('Token available:', !!token);

      try {
        const response = await fetch(`${baseUrl}/payment/widget-config/`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('Success! Widget config:', data);
          console.log('Note: UnivaPay widget expects amount in sen (JPY * 100)');
          console.log('Note: Charge endpoint should be /payment/univapay/charge/');
        } else {
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    };

    // Add a test function for the charge endpoint
    (window as any).testChargeEndpoint = async () => {
      const token = localStorage.getItem("accessToken");
      const baseUrl = "https://prod-be.examplesite.jp";
      console.log('Testing charge endpoint...');

      const testPayload = {
        transaction_token_id: "test_token_123",
        token_id: "test_token_123",
        token: "test_token_123",
        amount: 100,
        currency: "JPY",
        metadata: {
          order_id: "TEST-ORDER-123",
          gallery_uid: "test-gallery-uid",
          description: "Test charge"
        },
        three_ds: { mode: "normal" }
      };

      try {
        const response = await fetch(`${baseUrl}/payment/univapay/charge/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(testPayload)
        });

        console.log('Charge test response status:', response.status);
        console.log('Charge test response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('Charge test success:', data);
        } else {
          try {
            const errorData = await response.json();
            console.error('Charge test error (JSON):', errorData);
          } catch (e) {
            const errorText = await response.text();
            console.error('Charge test error (Text):', errorText);
          }
        }
      } catch (error) {
        console.error('Charge test network error:', error);
      }
    };

    // Add a test function to check gallery API response
    (window as any).testGalleryAPI = async () => {
      const token = localStorage.getItem("accessToken");
      const baseUrl = "https://prod-be.examplesite.jp";
      console.log('Testing gallery API to check price fields...');

      try {
        const response = await fetch(`${baseUrl}/gallery`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        console.log('Gallery API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Gallery API success - full response:', data);
          console.log('First few gallery items:', data.results?.slice(0, 3));
          console.log('Checking for price fields in first item:', data.results?.[0]);
        } else {
          const errorText = await response.text();
          console.error('Gallery API error:', errorText);
        }
      } catch (error) {
        console.error('Gallery API network error:', error);
      }
    };
  }, []);

  // Load UnivaPay widget config and script (robust, like subscription)
  useEffect(() => {
    console.log('[Souvenir] useEffect running for widget initialization');
    async function loadWidgetConfigAndScript() {
      console.log('[Souvenir] loadWidgetConfigAndScript function called');
      try {
        console.log('[Souvenir] Starting widget config fetch...');
        console.log('[Souvenir] Base URL:', baseUrl);
        console.log('[Souvenir] Full URL:', `${baseUrl}/payment/widget-config/`);
        console.log('[Souvenir] Making fetch request...');
        const token = localStorage.getItem("accessToken");
        console.log('[Souvenir] Access token available:', !!token);
        console.log('[Souvenir] Access token value:', token ? token.substring(0, 20) + '...' : 'null');
        console.log('[Souvenir] Access token length:', token ? token.length : 0);
        const res = await fetch(`${baseUrl}/payment/widget-config/`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        console.log('[Souvenir] Widget config response status:', res.status);
        if (!res.ok) {
          console.error('[Souvenir] Failed to fetch widget config:', res.status, res.statusText);
          throw new Error("Failed to load widget config");
        }
        const config = await res.json();
        console.log('[Souvenir] Widget config received:', config);
        setWidgetConfig(config);
        console.log('[Souvenir] Loading script from:', config.widget_url);
        await loadUnivapayScript(config.widget_url);
        console.log('[Souvenir] Widget loaded successfully');
        setWidgetLoaded(true);
      } catch (err: any) {
        console.error('[Souvenir] Widget loading failed:', err.message);
        setWidgetLoaded(false);
        setWidgetConfig(null);
      }
    }
    loadWidgetConfigAndScript();
    // eslint-disable-next-line
  }, []);

  // Open UnivaPay widget and handle payment (robust, like subscription)
  const openUnivapayWidget = async (orderData: any) => {
    console.log('[Souvenir] Attempting to open widget...');
    console.log('[Souvenir] Widget config:', widgetConfig);
    console.log('[Souvenir] Widget loaded:', widgetLoaded);
    if (!widgetConfig || !widgetLoaded) {
      console.error('[Souvenir] Payment system not ready - config:', !!widgetConfig, 'loaded:', widgetLoaded);
      toast.error("Payment system not ready. Please try again later.");
      return;
    }
    setSubmitting(true);
    try {
      // Wait for widget global
      const UnivapayGlobal = (window as any).Univapay || (window as any).UnivapayCheckout;
      console.log('[Souvenir] UnivapayGlobal available:', !!UnivapayGlobal);
      if (!UnivapayGlobal) throw new Error("UnivaPay widget not loaded");
      const orderId = generateOrderId();
      console.log('[Souvenir] Generated order ID:', orderId);
      console.log('[Souvenir] Raw orderData.amount:', orderData.amount);
      console.log('[Souvenir] Number(orderData.amount):', Number(orderData.amount));
      console.log('[Souvenir] Type of orderData.amount:', typeof orderData.amount);

      // UnivaPay expects amount in sen (1 JPY = 100 sen)
      const amountInSen = Math.round(Number(orderData.amount) * 100);
      console.log('[Souvenir] Amount in sen for UnivaPay:', amountInSen);

      const tokenId: string = await new Promise((resolve, reject) => {
        let widget;
        try {
          widget = UnivapayGlobal.create({
            appId: widgetConfig.app_token,
            storeId: widgetConfig.store_id,
            amount: amountInSen, // Use amount in sen
            currency: "JPY",
            checkout: "token",
            cvvAuthorize: true,
            metadata: {
              kind: "one_time",
              order_id: orderId,
              gallery_uid: orderModal?.uid,
              description: orderData.description,
            },
            onSuccess: (result: any) => {
              const tokenId = result?.id || result?.tokenId || result?.transactionTokenId || result?.transaction_token_id;
              if (!tokenId) {
                reject(new Error("No payment token received"));
                return;
              }
              resolve(tokenId);
            },
            onError: (err: any) => {
              reject(new Error(err?.message || "Widget error"));
            },
            onClose: () => {
              reject(new Error("Widget closed by user"));
            },
          });
          widget.open();
        } catch (err) {
          reject(err);
        }
        setTimeout(() => reject(new Error("Timed out waiting for payment token")), 120000);
      });
      // Call backend to create charge
      const token = localStorage.getItem("accessToken");
      const payload = {
        transaction_token_id: tokenId, // Primary: what backend expects
        token_id: tokenId, // Fallback: alternative name
        token: tokenId, // Another fallback
        amount: amountInSen, // Send amount in sen (integer) to backend
        currency: "JPY",
        metadata: {
          order_id: orderId,
          gallery_uid: orderModal?.uid,
          description: orderData.description,
        },
        three_ds: { mode: "normal" },
      };

      console.log('[Souvenir] Sending charge request to:', `${baseUrl}/payment/univapay/charge/`);
      console.log('[Souvenir] Charge payload:', JSON.stringify({
        ...payload,
        transaction_token_id: "***",
        token_id: "***",
        token: "***"
      }, null, 2));
      const res = await fetch(`${baseUrl}/payment/univapay/charge/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errorDetails;
        try {
          const err = await res.json();
          errorDetails = err;
          console.error('[Souvenir] Charge request failed - Backend Error Details:', {
            status: res.status,
            statusText: res.statusText,
            backendError: err,
            fullPayload: payload,
            url: `${baseUrl}/payment/univapay/charge/`
          });
          console.error('[Souvenir] Backend error message:', err.detail || err.message || err.error || JSON.stringify(err));
        } catch (parseError) {
          const errorText = await res.text();
          console.error('[Souvenir] Charge request failed - Raw Error Response:', {
            status: res.status,
            statusText: res.statusText,
            rawErrorText: errorText,
            fullPayload: payload,
            url: `${baseUrl}/payment/univapay/charge/`,
            parseError: parseError.message
          });
        }
        throw new Error("Payment failed - check console for backend error details");
      }
      // On success, create souvenir order
      const chargeData = await res.json();
      const souvenirPayload = {
        media_files: [{ gallery_uid: orderModal?.uid }],
        quantity: Number(orderData.quantity),
        description: orderData.description,
        special_note: orderData.special_note,
        desire_delivery_date: orderData.desire_delivery_date,
        order_id: orderId,
        amount: Number(orderData.amount), // Use original JPY amount for souvenir order
        payment_verified: true,
        request_status: "approved", // Set status to approved after successful payment
      };
      const souvenirRes = await fetch(`${baseUrl}/gallery/souvenir-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(souvenirPayload),
      });
      if (!souvenirRes.ok) {
        const err = await souvenirRes.json();
        throw new Error(err.detail || "Order creation failed after payment");
      }
      toast.success("Payment successful! Your order has been placed.");
      setOrderModal(null);
      fetchSouvenirRequests();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };


  // No longer need to check for session_id in URL; widget-based flow only

  useEffect(() => {
    fetchGallery();
  }, []);

  // Reset pagination to first page when requests change
  useEffect(() => {
    setRequestPage(1);
  }, [souvenirRequests]);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      quantity: 1,
      amount: "",
      description: "",
      special_note: "",
      desire_delivery_date: "",
    },
  });

  const onOrderSubmit = async (data: any) => {
    if (!orderModal) return;
    await openUnivapayWidget(data);
  };

  // Pre-fill amount when order modal opens
  useEffect(() => {
    if (orderModal && (orderModal.price || orderModal.price_jpy)) {
      const itemPrice = orderModal.price || orderModal.price_jpy;
      setValue("amount", itemPrice?.toString() || "");
    }
  }, [orderModal, setValue]);

  // Show processing overlay if payment is being processed
  if (paymentProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white/10 border border-white/20 rounded-xl p-8 backdrop-blur-2xl text-white text-center max-w-md">
          <div className="w-16 h-16 border-4 border-blue-400/20 border-t-blue-400 animate-spin rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Processing Payment...</h3>
          <p className="text-white/80">
            Please wait while we verify your payment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" pt-30 min-h-screen">
      <div className="max-w-6xl mt-4 lg:mt-0 mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={activeTab === "form" ? "glassSec" : "glass"}
              className="w-full"
              type="button"
              onClick={() => setActiveTab("form")}
            >
              新規注文
            </Button>
            <Button
              variant={activeTab === "list" ? "glassSec" : "glass"}
              className="w-full"
              type="button"
              onClick={async () => {
                setActiveTab("list");
                fetchSouvenirRequests();
              }}
            >
              注文一覧
            </Button>
          </div>
        </div>

        {activeTab === "form" && (
          <>
            <h2 className="text-2xl font-bold text-white mt-10 mb-8 text-center">
              ギャラリーからお土産を選択
            </h2>
            {loading ? (
              <Spinner />
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {galleryItems.map((item, index) => (
                  <div
                    key={item.uid}
                    className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    onClick={() => setOrderModal(item)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Card Container */}
                    <div className="relative rounded-2xl bg-white/10 shadow-xl border border-white/20 hover:border-blue-400 transition-all duration-300 backdrop-blur-xl overflow-hidden group-hover:shadow-blue-200/40">
                      {/* Image Container */}
                      <div className="relative aspect-square overflow-hidden">
                        {/* Main Image */}
                        <img
                          src={item.file}
                          alt={item.title}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Content Section */}
                      <div className="p-3 relative">
                        {/* Title */}
                        <h3 className="text-white font-semibold text-sm mb-2 leading-tight truncate">
                          {item.title}
                        </h3>

                        {/* Price Display */}
                        {(item.price || item.price_jpy) && (
                          <div className="mb-2">
                            <div className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-400/30 rounded-lg px-2 py-1 backdrop-blur-sm">
                              <span className="text-blue-400 font-bold text-sm">
                                ¥{(item.price || item.price_jpy)?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Indicator */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-blue-400/70 font-medium">
                            注文
                          </div>
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-400/30 transition-all duration-300">
                            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {orderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-black max-w-3xl w-full overflow-hidden relative rounded-2xl">
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-white w-9 h-9 flex items-center justify-center text-4xl cursor-pointer transition-all z-10"
                onClick={() => setOrderModal(null)}
              >
                <X size={30} className="hover:text-red-500" />
              </button>

              {/* Two Section Layout */}
              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="md:w-1/2 p-6 flex items-center justify-center bg-gradient-to-br from-blue-100/20 to-white/10 backdrop-blur-md">
                  <div className="w-full">
                    <img
                      src={orderModal.file}
                      alt={orderModal.title}
                      className="w-full h-auto object-cover rounded-xl shadow-lg border border-white/10"
                    />
                  </div>
                </div>

                {/* Form Section */}
                <div className="md:w-1/2 p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md">
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl text-white font-semibold mb-2">
                        {orderModal.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {orderModal.description}
                      </p>
                    </div>

                    {/* Form */}
                    <form
                      className="flex-1 flex flex-col gap-4"
                      onSubmit={handleSubmit(onOrderSubmit)}
                    >
                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium mb-1 text-white/80">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          {...register("quantity", { required: true, min: 1 })}
                          className="w-full p-3 rounded-lg border border-white/20 bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          placeholder="Enter quantity"
                        />
                        {errors.quantity && (
                          <span className="text-xs text-red-400 mt-1 block">
                            Quantity must be at least 1.
                          </span>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium mb-1 text-white/80 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Amount (¥)
                        </label>
                        <input
                          type="number"
                          min={1}
                          step="0.01"
                          {...register("amount", {
                            required: "Amount is required",
                            min: {
                              value: 1,
                              message: "Amount must be at least ¥1",
                            },
                            valueAsNumber: true,
                          })}
                          disabled
                          className="w-full p-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-not-allowed opacity-75"
                          placeholder="Enter amount in yen"
                        />
                        {errors.amount && (
                          <span className="text-xs text-red-400 mt-1 block">
                            {errors.amount.message}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium mb-1 text-white/80">
                          Description
                        </label>
                        <textarea
                          {...register("description", { required: true })}
                          className="w-full p-3 rounded-lg border border-white/20 bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                          rows={2}
                          placeholder="Provide order details..."
                        />
                        {errors.description && (
                          <span className="text-xs text-red-400 mt-1 block">
                            Description is required.
                          </span>
                        )}
                      </div>

                      {/* Special Note */}
                      <div>
                        <label className="block text-sm font-medium mb-1 text-white/80">
                          Special Note (Optional)
                        </label>
                        <textarea
                          {...register("special_note")}
                          className="w-full p-3 rounded-lg border border-white/20 bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                          rows={2}
                          placeholder="Optional notes..."
                        />
                      </div>

                      {/* Delivery Date */}
                      <div>
                        <label className="block text-sm font-medium mb-1 text-white/80">
                          Desired Delivery Date
                        </label>
                        <input
                          type="date"
                          {...register("desire_delivery_date", { required: true })}
                          className="w-full p-3 rounded-lg border border-white/20 bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />
                        {errors.desire_delivery_date && (
                          <span className="text-xs text-red-400 mt-1 block">
                            Delivery date is required.
                          </span>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="mt-auto pt-4">
                        <Button
                          type="submit"
                          variant="glassSec"
                          size="md"
                          className="rounded-lg border border-white/20 w-full hover:bg-blue-400/20 transition-all"
                          loading={submitting}
                          disabled={submitting}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            <span>
                              {submitting ? "Processing..." : "Proceed to Payment"}
                            </span>
                          </div>
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <div className="glass-card p-0 mt-8 overflow-hidden">
            {/* Header */}
            <div className="glass-heigh-pro rounded-0 px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3 font-jakarta">
                <ClipboardList className="w-6 h-6 text-white/80" />
                注文一覧
              </h2>
            </div>

            <div className="p-6">
              {loadingRequests ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                </div>
              ) : requestError ? (
                <div className="glass-red p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-white/90" />
                    <span className="text-white/90 font-medium font-jakarta">
                      {requestError}
                    </span>
                  </div>
                </div>
              ) : souvenirRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="glass-mid w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-10 h-10 text-white/60" />
                  </div>
                  <p className="text-white/80 text-lg font-medium font-jakarta mb-2">
                    注文がありません
                  </p>
                  <p className="text-white/60 text-sm font-jakarta">
                    新しい注文を作成してください
                  </p>
                </div>
              ) : (
                <>
                  {/* Order List */}
                  <div className="grid grid-cols-1 md:grid-cols-2  w-full  gap-6">
                    {paginatedRequests.map((req, idx) => (
                      <div
                        key={req.uid}
                        className="rounded-2xl w-full  glass border border-slate-700/50 hover:border-blue-400/50 transition-all duration-300 p-6 shadow-xl animate-fade-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {/* Header with Icon and Status */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 flex-shrink-0">
                              <Package className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-blue-400 font-semibold text-lg truncate font-jakarta">
                              {req.description?.slice(0, 40) || "タイトルなし"}
                              {req.description?.length > 40 && "..."}
                            </h3>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-3 ${
                              req.request_status === "approved"
                                ? "bg-green-500 text-white"
                                : req.request_status === "pending"
                                ? "bg-yellow-500 text-black"
                                : req.request_status === "rejected"
                                ? "bg-red-500 text-white"
                                : req.request_status === "new"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {req.request_status === "approved" && "支払済み"}
                            {req.request_status === "pending" && "審査中"}
                            {req.request_status === "rejected" && "却下"}
                            {req.request_status === "new" && "未払い"}
                            {!["approved", "pending", "rejected", "new"].includes(
                              req.request_status
                            ) && req.request_status}
                          </span>
                        </div>

                        {/* Note/Description */}
                        {req.special_note && (
                          <div className="mb-4">
                            <span className="text-white/70 text-sm font-medium font-jakarta">
                              Note:{" "}
                            </span>
                            <span className="text-white text-sm font-jakarta">
                              {req.special_note}
                            </span>
                          </div>
                        )}

                        {/* Delivery Date */}
                        <div className="mb-4">
                          <span className="text-white/70 text-sm font-medium font-jakarta">
                            Delivery:{" "}
                          </span>
                          <span className="text-white text-sm font-jakarta">
                            {req.desire_delivery_date
                              ? new Date(
                                  req.desire_delivery_date
                                ).toLocaleDateString("ja-JP")
                              : "指定なし"}
                          </span>
                        </div>

                        {/* Product Images */}
                        {Array.isArray(req.media_files) &&
                          req.media_files.length > 0 && (
                            <div className="flex gap-2 mb-4">
                              {req.media_files.slice(0, 4).map((file, i) => (
                                <div
                                  key={i}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-white/5 shadow-sm"
                                >
                                  <img
                                    src={
                                      file.file.startsWith("http")
                                        ? file.file
                                        : `${baseUrl}${file.file}`
                                    }
                                    alt={`商品画像 ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {req.media_files.length > 4 && (
                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                                  <span className="text-white/70 text-xs font-semibold font-jakarta">
                                    +{req.media_files.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Additional Details */}
                        {req.quantity && (
                          <div className="mb-2">
                            <span className="text-white/70 text-sm font-medium font-jakarta">
                              Quantity:{" "}
                            </span>
                            <span className="text-white text-sm font-jakarta">
                              {req.quantity}
                            </span>
                          </div>
                        )}

                        <div className="text-white/50 text-xs font-mono font-jakarta">
                          ID: {req.uid?.slice(0, 8) || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pt-6">
                      <div className="glass-mid rounded-full p-1 border border-white/20">
                        <button
                          className="px-4 py-2 text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-jakarta rounded-full hover:bg-white/10"
                          onClick={() =>
                            setRequestPage((p) => Math.max(1, p - 1))
                          }
                          disabled={requestPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1 inline" />
                          前へ
                        </button>
                      </div>

                      <div className="glass-heigh px-4 py-2 rounded-full border border-white/20">
                        <span className="text-white/60 text-sm font-jakarta">
                          ページ{" "}
                        </span>
                        <span className="text-white font-semibold font-jakarta">
                          {requestPage}
                        </span>
                        <span className="text-white/60 text-sm font-jakarta">
                          {" "}
                          / {totalPages}
                        </span>
                      </div>

                      <div className="glass-mid rounded-full p-1 border border-white/20">
                        <button
                          className="px-4 py-2 text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-jakarta rounded-full hover:bg-white/10"
                          onClick={() =>
                            setRequestPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={requestPage === totalPages}
                        >
                          次へ
                          <ChevronRight className="w-4 h-4 ml-1 inline" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default AlibiSouvenir;
