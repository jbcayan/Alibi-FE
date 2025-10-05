import { baseUrl } from "@/constants/baseApi";

export interface SubscriptionPlan {
  uid: string;
  name: string;
  description: string;
  amount_jpy: number;
  billing_interval: string;
  billing_interval_label: string;
  is_active: boolean;
  original_period?: string; // Store the original period from backend
}

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  has_premium_access: boolean;
  subscription_status: string;
  access_level: string;
  subscription: any;
  plan_name?: string;
  status?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  is_premium?: boolean;
}

export interface CheckoutResponse {
  checkout_url?: string;
  session_id?: string;
  ok?: boolean;
  payment?: any;
  univapay?: any;
}

export interface ConfirmResponse {
  detail: string;
  is_premium: boolean;
  status: string;
  current_period_end: string;
}

class SubscriptionAPIClient {
  private getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    console.log("🔍 [DEBUG] getAuthHeaders - Token:", token ? "Present" : "Missing");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async getSubscriptionPlans(): Promise<{ results: SubscriptionPlan[] }> {
    const response = await fetch(`${baseUrl}/payment/subscription-plans/`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch subscription plans");
    }
    return response.json();
  }

  async createCheckoutSession(
    transaction_token_id: string,
    amount: number,
    period: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutResponse> {
    // Process payment with correct metadata
    const requestBody = {
      transaction_token_id,
      amount,
      currency: "JPY",
      period: period === "six_months" ? "semiannually" : period === "month" ? "monthly" : period,
      metadata: { plan_id: planId },
      three_ds: { mode: "normal" },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const response = await fetch(`${baseUrl}/payment/univapay/subscription/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create UnivaPay subscription session: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async confirmSubscription(sessionId: string): Promise<ConfirmResponse> {
    // UnivaPay: confirm via status endpoint or similar if needed
    const response = await fetch(`${baseUrl}/payment/subscription-status/`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to confirm subscription");
    }
    return response.json();
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const token = localStorage.getItem("accessToken");
    console.log("🔍 [DEBUG] getSubscriptionStatus - Token:", token ? "Present" : "Missing");

    if (!token) {
      throw new Error("No access token found");
    }

    const headers = this.getAuthHeaders();
    console.log("🔍 [DEBUG] getSubscriptionStatus - Headers:", {
      Authorization: headers.Authorization ? "Bearer ***" : "Missing",
      "Content-Type": headers["Content-Type"]
    });

    const url = `${baseUrl}/payment/subscription-status/`;
    console.log("🔍 [DEBUG] getSubscriptionStatus - URL:", url);

    try {
      const response = await fetch(url, {
        headers: headers,
      });

      console.log("🔍 [DEBUG] getSubscriptionStatus - Response status:", response.status);
      console.log("🔍 [DEBUG] getSubscriptionStatus - Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔍 [DEBUG] getSubscriptionStatus - Error response:", errorText);
        throw new Error(`Failed to fetch subscription status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🔍 [DEBUG] getSubscriptionStatus - Success response:", data);
      return data;
    } catch (error) {
      console.error("🔍 [DEBUG] getSubscriptionStatus - Network error:", error);
      throw error;
    }
  }

  async cancelSubscription(): Promise<{ detail: string; ends_on: string }> {
    const response = await fetch(`${baseUrl}/payment/univapay/cancel-subscription/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ termination_mode: "immediate" }),
    });
    if (!response.ok) {
      throw new Error("Failed to cancel subscription");
    }
    return response.json();
  }
}

export const subscriptionApiClient = new SubscriptionAPIClient();
