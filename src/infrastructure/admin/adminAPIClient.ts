import { baseUrl } from "@/constants/baseApi";
import { getAuthHeaders } from "./utils/getAuthHeaders";

import { AdminUsersResponse } from "./utils/types";

class AdminAPIClient {
  private readonly apiUrl = baseUrl;

  public async getAdminUsers(): Promise<AdminUsersResponse> {
    const response = await fetch(`${this.apiUrl}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("ユーザーデータの取得に失敗しました");
    }
    const data = await response.json();
    return data.results;
  }
}

export const productAPIClient = new AdminAPIClient();

import { UpdateUserData, UserData } from "@/types/admin/user";

class AdminApiClient {
  private readonly apiUrl = baseUrl;

  public async getAdminUsers(): Promise<AdminUsersResponse> {
    const response = await fetch(`${this.apiUrl}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("ユーザーデータの取得に失敗しました");
    }

    const data = await response.json();
    return data.results;
  }

  public async getUserById(uid: string): Promise<UserData> {
    const response = await fetch(`${this.apiUrl}/users/${uid}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("ユーザーが見つかりません");
      }
      if (response.status === 403) {
        throw new Error("アクセス権限がありません");
      }
      throw new Error("ユーザーデータの取得に失敗しました");
    }

    const data = await response.json();
    return data;
  }

  public async updateUser(
    uid: string,
    updateData: UpdateUserData
  ): Promise<UserData> {
    const headers = getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/users/${uid}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("ユーザーが見つかりません");
      }
      if (response.status === 403) {
        throw new Error("更新権限がありません");
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || "無効なデータです");
      }
      throw new Error("ユーザーデータの更新に失敗しました");
    }

    const data = await response.json();
    return data;
  }
}

export const adminAPIClient = new AdminApiClient();
