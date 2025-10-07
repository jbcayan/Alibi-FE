"use client";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { z } from "zod";

// Separate schemas for create and edit modes
const createSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  is_public: z.string().default("true"),
  price: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: "有効な価格を入力してください",
    }),
  file: z
    .any()
    .refine((file) => {
      if (typeof window === "undefined") return true;
      return file instanceof File;
    }, "写真ファイルを選択してください")
    .refine((file) => {
      if (typeof window === "undefined") return true;
      return file?.size && file.size <= 5000000;
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
    }, "対応していないファイル形式です"),
}).refine((data) => {
  // If private (is_public = "false"), price is required
  if (data.is_public === "false") {
    return data.price && data.price.trim() !== "";
  }
  return true;
}, {
  message: "非公開写真には価格を設定してください",
  path: ["price"],
});

const editSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  is_public: z.string(),
  price: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: "有効な価格を入力してください",
    }),
  file: z.any().optional(),
}).refine((data) => {
  // If private (is_public = "false"), price is required
  if (data.is_public === "false") {
    return data.price && data.price.trim() !== "";
  }
  return true;
}, {
  message: "非公開写真には価格を設定してください",
  path: ["price"],
});

// Form data types
export type UploadFormData = z.infer<typeof createSchema>;
export type EditFormData = z.infer<typeof editSchema>;

// Photo data interface
interface PhotoData {
  uid: string;
  title: string;
  description: string;
  file: string;
  is_public?: boolean;
  price?: string;
}

// Edit photo data interface
interface EditPhotoData {
  uid: string;
  title: string;
  description: string;
  file?: File;
  is_public?: boolean;
  price?: string;
}

// Custom Modal with Light Gray Blur Background
const CustomModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Photo Upload Modal Component
const PhotoUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UploadFormData) => void;
  onUpdate: (data: EditPhotoData) => void;
  editPhoto?: PhotoData | null;
}> = ({ isOpen, onClose, onSubmit, onUpdate, editPhoto }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editPhoto;
  const schema = isEditMode ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      is_public: "true",
      price: "",
    },
  });

  // Watch is_public to clear price when switching to public
  const watchedIsPublic = watch("is_public");
  useEffect(() => {
    if (watchedIsPublic === "true") {
      setValue("price", "");
    }
  }, [watchedIsPublic, setValue]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous preview URL
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);
      setValue("file", file);

      // Create new preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClose = () => {
    // Clean up preview URL
    if (previewUrl && selectedFile) {
      URL.revokeObjectURL(previewUrl);
    }

    onClose();
    reset();
    setSelectedFile(null);
    setPreviewUrl("");
    setIsSubmitting(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    // debug
    // console.log({ DataFromModal: data });
    try {
      if (isEditMode && editPhoto) {
        // Update mode
        await onUpdate({
          uid: editPhoto.uid,
          title: data.title,
          description: data.description || "",
          is_public: data.is_public === "true",
          price: data.price || "",
          file: selectedFile || undefined,
        });
      } else {
        // Create mode
        await onSubmit({
          ...data,
          is_public: data.is_public === "true",
          price: data.price || "",
        });
      }

      handleClose();
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = isEditMode || selectedFile;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "写真を編集" : "新しい写真をアップロード"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* File Upload */}
          <Input
            label={
              isEditMode ? "写真ファイル（変更する場合のみ）" : "写真ファイル"
            }
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            error={!isEditMode ? (errors.file?.message as string) : undefined}
          />

        {/* Preview */}
        {previewUrl && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プレビュー
            </label>
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
              <img
                src={previewUrl}
                alt="プレビュー"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label="タイトル"
          placeholder="写真のタイトルを入力"
          register={register("title")}
          error={errors.title?.message}
        />

        {/* Description */}
        <Textarea
          label="説明（オプション）"
          placeholder="写真の説明を入力"
          register={register("description")}
        />

        {/* Public/Private */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            公開設定
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                {...register("is_public")}
                value="true"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">公開</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                {...register("is_public")}
                value="false"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">非公開</span>
            </label>
          </div>
          {errors.is_public?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.is_public.message}</p>
          )}
        </div>

        {/* Price - Only show for private photos */}
        {watch("is_public") === "false" && (
          <Input
            label="価格 *"
            placeholder="販売価格を入力（例: 1000）"
            register={register("price")}
            error={errors.price?.message}
          />
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting
              ? isEditMode
                ? "更新中..."
                : "アップロード中..."
              : isEditMode
              ? "更新"
              : "アップロード"}
          </Button>
        </div>
      </form>
    </CustomModal>
  );
};

export default PhotoUploadModal;
