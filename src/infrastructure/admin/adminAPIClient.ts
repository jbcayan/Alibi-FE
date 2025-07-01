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
