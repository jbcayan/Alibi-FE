export type User = {
  id?: string;
  name?: string;
  role?: string;
  avatar?: string;
  email: string;
  kind: "ADMIN" | "USER" | "UNDEFINED" | string;
  is_active?: boolean;
  is_verified?: boolean;
  is_subscribed?: boolean | string;
};
export interface TUser {
  uid: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_subscribed: boolean;
  kind: "END_USER" | "SUPER_ADMIN";
}

// Add to your existing types file or create a new one: types/passwordReset.ts

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequestResponse {
  detail: string;
}

export interface PasswordResetConfirmResponse {
  detail: string;
}

// Form data types for components
export interface ResetRequestFormData {
  email: string;
}

export interface ResetConfirmFormData {
  new_password: string;
  confirm_password: string;
}
