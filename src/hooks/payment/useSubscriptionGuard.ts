// hooks/useSubscriptionGuard.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  subscriptionApiClient,
  SubscriptionStatus,
} from "@/infrastructure/subscription/subscriptionAPIClient";
import Cookies from "js-cookie";

export const useSubscriptionGuard = (redirectToPlans: boolean = true) => {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") || Cookies.get("accessToken");

        console.log("🔍 [DEBUG] useSubscriptionGuard - Token from localStorage:", localStorage.getItem("accessToken") ? "Present" : "Missing");
        console.log("🔍 [DEBUG] useSubscriptionGuard - Token from Cookies:", Cookies.get("accessToken") ? "Present" : "Missing");
        console.log("🔍 [DEBUG] useSubscriptionGuard - Final token:", token ? "Present" : "Missing");

        if (!token) {
          console.log("🔍 [DEBUG] useSubscriptionGuard - No token found, redirecting to login");
          // User not logged in, redirect to login
          router.push("/login");
          return;
        }

        console.log("🔍 [DEBUG] useSubscriptionGuard - Calling getSubscriptionStatus");
        const status = await subscriptionApiClient.getSubscriptionStatus();
        console.log("🔍 [DEBUG] useSubscriptionGuard - Subscription status received:", status);

        setSubscriptionStatus(status);

        // If user doesn't have an active subscription and redirectToPlans is true
        if (
          redirectToPlans &&
          (!status.has_active_subscription || status.subscription_status !== "current")
        ) {
          // Check if user recently completed payment (within last 30 seconds)
          const lastPaymentTime = localStorage.getItem("last_payment_timestamp");
          const now = Date.now();
          const recentlyPaid = lastPaymentTime && (now - parseInt(lastPaymentTime)) < 30000; // 30 seconds

          if (recentlyPaid) {
            console.log("🔄 User recently completed payment, skipping redirect to allow status update");
            setLoading(false);
            return;
          }

          console.log("🔍 [DEBUG] useSubscriptionGuard - No active subscription, redirecting to plans");
          router.push("/subscription-plans");
          return;
        }

        setLoading(false);
        console.log("🔍 [DEBUG] useSubscriptionGuard - Check completed successfully");
      } catch (err) {
        console.error("🔍 [DEBUG] useSubscriptionGuard - Subscription check failed:", err);
        setError(`Failed to check subscription status: ${err.message}`);

        // If API call fails, might be due to invalid token
        // Clear tokens and redirect to login
        console.log("🔍 [DEBUG] useSubscriptionGuard - Clearing tokens and redirecting to login");
        localStorage.removeItem("accessToken");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        Cookies.remove("role");

        router.push("/login");
      }
    };

    checkSubscription();
  }, [router, redirectToPlans]);

  const refreshSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const status = await subscriptionApiClient.getSubscriptionStatus();
      setSubscriptionStatus(status);
      setLoading(false);
    } catch (err) {
      console.error("Failed to refresh subscription status:", err);
      setError("Failed to refresh subscription status");
      setLoading(false);
    }
  };

  return {
    subscriptionStatus,
    loading,
    error,
    refreshSubscriptionStatus,
    hasActiveSubscription:
      subscriptionStatus?.has_active_subscription &&
      subscriptionStatus?.subscription_status === "current",
    isPremium: subscriptionStatus?.is_premium || false,
  };
};
