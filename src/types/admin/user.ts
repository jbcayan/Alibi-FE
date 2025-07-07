// User data interface
export interface UserData {
  uid: string;
  email: string;
  is_active: boolean;
  kind: string;
  is_verified: boolean;
  is_subscribed: boolean;
}

// Response interface for admin users list
export interface AdminUsersResponse {
  results: UserData[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Update user data interface (only fields that can be updated)
export interface UpdateUserData {
  is_active: boolean;
  kind: string;
  is_verified: boolean;
}

// User kind enum
export type UserKind = "END_USER" | "SUPER_ADMIN";

// API error interface
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
}

// Success response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
