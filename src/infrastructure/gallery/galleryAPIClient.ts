import { getAuthHeaders } from "../admin/utils/getAuthHeaders";
import { GalleryResponse, Photo } from "./utils/types";
import { baseUrl } from "@/constants/baseApi";

class GalleryAPIClient {
  private readonly baseURL = baseUrl;
  private authToken: string | null = null;

  private get headers(): HeadersInit {
    const headers: HeadersInit = getAuthHeaders();
    return headers;
  }

  public setAuthToken(token: string) {
    this.authToken = token;
  }

  public clearAuthToken() {
    this.authToken = null;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("認証が必要です。ログインしてください。");
      }

      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the default error message
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  public async getPhotos(page = 1, limit = 20): Promise<GalleryResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/gallery/admin?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: this.headers,
        }
      );

      return await this.handleResponse<GalleryResponse>(response);
    } catch (error) {
      console.error("Failed to fetch photos:", error);
      throw error;
    }
  }

  public async createPhoto(data: {
    title: string;
    description: string;
    file: File;
    file_type: string;
    is_public?: boolean;
    price?: string;
  }): Promise<Photo> {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("file_type", data.file_type);
      formData.append("file", data.file);
      formData.append("is_public", data.is_public ? "true" : "false");
      if (data.price) {
        formData.append("price", data.price);
      }

      // Create headers without Content-Type for FormData
      const requestHeaders = { ...this.headers };
      delete (requestHeaders as any)["Content-Type"];

      const response = await fetch(`${this.baseURL}/gallery/admin`, {
        method: "POST",
        headers: requestHeaders,
        body: formData,
      });

      return await this.handleResponse<Photo>(response);
    } catch (error) {
      console.error("Failed to create photo:", error);
      throw error;
    }
  }

  public async updatePhoto(
    uid: string,
    data: {
      title: string;
      description: string;
      file?: File;
      is_public?: boolean;
      price?: string;
    }
  ): Promise<Photo> {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("status", "ACTIVE");
      formData.append("file_type", "image");
      formData.append("is_public", data.is_public ? "true" : "false");
      if (data.price) {
        formData.append("price", data.price);
      }

      // If new file is provided, append it; otherwise, keep existing
      if (data.file) {
        formData.append("file", data.file);
      }

      // Create headers without Content-Type for FormData
      const requestHeaders = { ...this.headers };
      delete (requestHeaders as any)["Content-Type"];
      // console.log({ formData });

      const response = await fetch(`${this.baseURL}/gallery/admin/${uid}`, {
        method: "PATCH",
        headers: requestHeaders,
        body: formData,
      });

      return await this.handleResponse<Photo>(response);
    } catch (error) {
      console.error("Failed to update photo:", error);
      throw error;
    }
  }

  public async deletePhoto(uid: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/gallery/admin/${uid}`, {
        method: "DELETE",
        headers: this.headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("認証が必要です。ログインしてください。");
        }

        let errorMessage = `Failed to delete photo: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the default error message
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
      throw error;
    }
  }
}

export const galleryAPIClient = new GalleryAPIClient();
