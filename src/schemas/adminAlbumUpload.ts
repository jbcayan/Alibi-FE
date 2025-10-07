import { z } from "zod";

// File validation helper
const fileValidation = z
  .any()
  .refine((file) => {
    if (typeof window === "undefined") return true;
    return file instanceof File;
  }, "写真ファイルを選択してください")
  .refine((file) => {
    if (typeof window === "undefined") return true;
    return file?.size && file.size <= 5000000; // 5MB limit
  }, "ファイルサイズは5MB以下にしてください")
  .refine((file) => {
    if (typeof window === "undefined") return true;
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    return file?.type && allowedTypes.includes(file.type);
  }, "対応していないファイル形式です（JPEG、PNG、WebP、GIFのみ対応）");

// Schema for creating new photos - file is required
export const uploadSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  category: z
    .string()
    .min(1, "カテゴリーを選択してください")
    .refine((val) => ["work", "travel", "event", "other"].includes(val), {
      message: "有効なカテゴリーを選択してください",
    }),
  description: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 500, {
      message: "説明は500文字以内で入力してください",
    }),
  is_public: z.boolean().default(true),
  price: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: "有効な価格を入力してください",
    }),
  file: fileValidation,
});

// Schema for editing existing photos - file is optional
export const editSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  category: z
    .string()
    .min(1, "カテゴリーを選択してください")
    .refine((val) => ["work", "travel", "event", "other"].includes(val), {
      message: "有効なカテゴリーを選択してください",
    }),
  description: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 500, {
      message: "説明は500文字以内で入力してください",
    }),
  is_public: z.boolean().default(true),
  price: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: "有効な価格を入力してください",
    }),
  file: fileValidation.optional(),
});

// Type exports
export type UploadFormData = z.infer<typeof uploadSchema>;
export type EditFormData = z.infer<typeof editSchema>;

// Category options for UI components
export const categoryOptions = [
  { value: "work", label: "仕事" },
  { value: "travel", label: "旅行" },
  { value: "event", label: "イベント" },
  { value: "other", label: "その他" },
] as const;

// Category type
export type CategoryType = (typeof categoryOptions)[number]["value"];

// Validation helpers
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 5
): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return allowedTypes.includes(file.type);
};

export const getFileErrorMessage = (file: File): string | null => {
  if (!validateFileType(file)) {
    return "対応していないファイル形式です（JPEG、PNG、WebP、GIFのみ対応）";
  }

  if (!validateFileSize(file)) {
    return "ファイルサイズは5MB以下にしてください";
  }

  return null;
};
