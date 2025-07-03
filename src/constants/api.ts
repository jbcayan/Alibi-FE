import { baseUrl } from "./baseApi";

// constants/api.ts
export const BASE_URL = baseUrl;

export interface User {
  id: number;
  email: string;
  kind: string;
  // Add other user properties as needed
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}
