export type LoginResponse = {
  user: {
    email: string;
    kind: "UNDEFINED" | string;
  };
  refresh: string;
  access: string;
};

export type RegisterResponse = {
  detail: string;
};

export type AuthResponse = LoginResponse | RegisterResponse;

export type UserPhotoEditRequest = {
  description: string;
  special_note: string;
  desire_delivery_date: string;
  request_files: string[];
};

export type UserPhotoEditRequestResponse = {
  uid: string; // UUID format
  description: string;
  special_note: string;
  request_status: string; // API may return 'pending', 'completed', etc.
  desire_delivery_date: string; // ISO date string
  files?: Array<{
    file_type: string;
    user_request_file: string;
    file_status: string;
    admin_response_file: string | null;
  }>;
};

export type UserPhotoEditRequestsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserPhotoEditRequestResponse[];
};

export interface UserVideoAudioEditRequest {
  title: string;
  description: string;
  special_note?: string; // Corresponds to `additionalNotes`
  desire_delivery_date: string; // ISO 8601 string, corresponds to `dueDate`
  edit_type:
    | "photo_editing"
    | "video_editing"
    | "audio_editing"
    | "video_audio_editing"
    | "other"; // Mapping `editType`
  request_files: string[]; // Array of file URLs/IDs (for video/audio files)
}

export interface UserVideoAudioEditRequestResponse {
  uid: string;
  code: string;
  description: string;
  special_note?: string;
  request_status: string;
  request_type: string;
  desire_delivery_date: string;
  files?: Array<{
    file_type: string;
    user_request_file: string;
    file_status: string;
    admin_response_file: string | null;
  }>;
  created_at: string;
}

export type UserVideoAudioEditRequestsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserVideoAudioEditRequestResponse[];
};

// types for gallery=======================
export interface GalleryItem {
  uid: string;
  title: string;
  code: string;
  description: string;
  file_type: string; // "image", "video", etc.
  file: string;
  price?: number; // Price in JPY
  price_jpy?: number; // Alternative price field
}

export interface GalleryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GalleryItem[];
}

export interface UserSouvenirRequestResponse {
  uid: string;
  description: string;
  special_note: string;
  request_status: "pending" | "approved" | "rejected" | "new";
  desire_delivery_date: string;
  quantity: number;
  media_files: GalleryItem[];
}
