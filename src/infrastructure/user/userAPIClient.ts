import {
  PasswordResetConfirmData,
  PasswordResetConfirmResponse,
  PasswordResetRequestData,
  PasswordResetRequestResponse,
} from "@/types/user/types";
import { GalleryResponse as GalleryPhotoResponse } from "../gallery/utils/types";
import {
  LoginResponse,
  UserPhotoEditRequest,
  UserPhotoEditRequestResponse,
  UserPhotoEditRequestsListResponse,
  UserVideoAudioEditRequest,
  UserVideoAudioEditRequestResponse,
  UserVideoAudioEditRequestsListResponse,
  UserSouvenirRequestResponse,
  GalleryResponse,
} from "./utils/types";
import { baseUrl } from "@/constants/baseApi";

export interface LoginRequest {
  email: string;
  password: string;
}

class UserAPIClient {
  private readonly apiUrl = baseUrl;

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  public async userRegister(registerData: {
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<{ detail: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      const data = await response.json();
      return data; // { detail: "User registered successfully" }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  public async userLogin(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/users/login`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Login failed`);
      }

      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  public async passwordResetRequest(
    data: PasswordResetRequestData
  ): Promise<PasswordResetRequestResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/users/password-reset-request`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(data), // ✅ Fixed: Added JSON.stringify
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Password reset request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  }

  public async passwordResetConfirm(
    data: PasswordResetConfirmData
  ): Promise<PasswordResetConfirmResponse> {
    try {
      const { uid, token, new_password, confirm_password } = data;

      // Send only password data in body, uid and token in URL
      const resetData = {
        new_password,
        confirm_password,
      };

      const response = await fetch(
        `${this.apiUrl}/users/password-reset-confirm/${uid}/${token}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(resetData), // ✅ Fixed: Added JSON.stringify
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Password reset confirmation failed"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Password reset confirm error:", error);
      throw error;
    }
  }

  public async changePassword(data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ detail: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/users/change-password`, {
        method: "PUT",
        headers: this.getHeaders(), // Automatically includes Authorization
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Password change failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }

  public async getUserProfile(): Promise<{ email: string; kind: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/users/profile`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Profile fetch error:", error);
      throw error;
    }
  }

  public async deleteUser(uid: string) {
    try {
      const response = await fetch(`${this.apiUrl}/users/${uid}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete user");
      }

      return await response.json();
    } catch (error) {
      console.error("User delete error:", error);
      throw error;
    }
  }

  public async userPhotoEditRequests(
    formData: FormData
  ): Promise<UserPhotoEditRequestResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/gallery/photo-edit-requests`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(localStorage.getItem("accessToken") && {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            }),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to photo edit request`);
      }

      return await response.json();
    } catch (error) {
      console.error("Photo request fetch error:", error);
      throw error;
    }
  }

  public async userVideoAndAudioRequests(
    bodyData: UserVideoAudioEditRequest
  ): Promise<UserVideoAudioEditRequestResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/gallery/video-audio-edit-requests`, // Assuming this is the correct endpoint
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(bodyData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to video/audio edit request`
        );
      }

      const data: UserVideoAudioEditRequestResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Video/audio request fetch error:", error);
      throw error;
    }
  }

  public async getUserVideoAudioEditRequests(): Promise<
    UserVideoAudioEditRequestsListResponse
  > {
    try {
      const response = await fetch(
        `${this.apiUrl}/gallery/video-audio-edit-requests`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to fetch video/audio edit requests`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Video/audio request list fetch error:", error);
      throw error;
    }
  }

  public async getUserPhotoEditRequests(): Promise<
    UserPhotoEditRequestsListResponse
  > {
    try {
      const response = await fetch(
        `${this.apiUrl}/gallery/photo-edit-requests`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to fetch photo edit requests`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Photo edit request list fetch error:", error);
      throw error;
    }
  }

  public async getGalleryPhotos(): Promise<GalleryPhotoResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/gallery`, {
        method: "GET",
        headers: this.getHeaders(), // Assumes Authorization or other headers are set here
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch gallery data");
      }

      const data: GalleryPhotoResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Gallery fetch error:", error);
      throw error;
    }
  }

  public async getSouvenirGallery(): Promise<GalleryResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/gallery/souvenir`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch souvenir gallery data");
      }

      const data: GalleryResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Souvenir gallery fetch error:", error);
      throw error;
    }
  }

  public async getUserSouvenirRequests(): Promise<
    UserSouvenirRequestResponse[]
  > {
    try {
      const response = await fetch(`${this.apiUrl}/gallery/souvenir-requests`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to fetch souvenir requests`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Souvenir request list fetch error:", error);
      throw error;
    }
  }

  async verifyOtp(data: { otp: string }): Promise<{ detail: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/users/verify-otp`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `OTP verification failed`);
      }

      return await response.json();
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  }

  public async createSouvenirOrder(orderData: {
    media_files: { gallery_uid: string }[];
    quantity: number;
    description: string;
    special_note?: string;
    desire_delivery_date: string;
    amount: number;
  }): Promise<{ uid: string; code: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/gallery/souvenir-requests`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          media_files: orderData.media_files, // Send as array of objects with gallery_uid
          quantity: orderData.quantity,
          description: orderData.description,
          special_note: orderData.special_note,
          desire_delivery_date: orderData.desire_delivery_date,
          amount: orderData.amount,
          payment_verified: false,
          request_status: "new",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[API] Souvenir order creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          payload: {
            media_files: orderData.media_files,
            quantity: orderData.quantity,
            description: orderData.description,
            special_note: orderData.special_note,
            desire_delivery_date: orderData.desire_delivery_date,
            amount: orderData.amount,
            payment_verified: false,
            request_status: "new",
          }
        });
        throw new Error(errorData.detail || "Failed to create souvenir order");
      }

      return await response.json();
    } catch (error) {
      console.error("Souvenir order creation error:", error);
      throw error;
    }
  }
}

export const userApiClient = new UserAPIClient();
