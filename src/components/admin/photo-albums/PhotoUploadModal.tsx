"use client";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import { z } from "zod";

// Single schema for both create and edit modes
const formSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  file_type: z.enum(["image", "audio", "video", "pdf", "docx", "pptx", "xlsx", "other"]).optional(),
  is_public: z.string().default("true"),
  price: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: "有効な価格を入力してください",
    }),
  file: z.any().optional(),
});

// Combined form data type for both create and edit
type FormData = {
  title: string;
  description?: string;
  file_type?: "image" | "audio" | "video" | "pdf" | "docx" | "pptx" | "xlsx" | "other";
  is_public?: string;
  price?: string;
  file?: any;
};

// Photo data interface
interface PhotoData {
  uid: string;
  title: string;
  description: string;
  file: string;
  file_type?: string;
  is_public?: boolean;
  price?: string;
}

// Edit photo data interface
interface EditPhotoData {
  uid: string;
  title: string;
  description: string;
  file?: File;
  file_type?: string;
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
  onSubmit: (data: FormData) => void;
  onUpdate: (data: EditPhotoData) => void;
  editPhoto?: PhotoData | null;
}> = ({ isOpen, onClose, onSubmit, onUpdate, editPhoto }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editPhoto;
  const schema = formSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      file_type: undefined, // No default file type
      is_public: "true",
      price: "",
    },
  });

  const watchedFileType = watch("file_type");

  const getAcceptAttribute = (fileType: string) => {
    const acceptMap = {
      image: "image/*",
      audio: "audio/*",
      video: "video/*",
      pdf: ".pdf",
      docx: ".doc,.docx",
      pptx: ".ppt,.pptx",
      xlsx: ".xls,.xlsx",
      other: ".txt",
    };
    return acceptMap[fileType as keyof typeof acceptMap] || "*/*";
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedFile]);

  // Populate form when editPhoto changes
  useEffect(() => {
    if (editPhoto) {
      setValue("title", editPhoto.title);
      setValue("description", editPhoto.description || "");
      setValue("is_public", editPhoto.is_public ? "true" : "false");
      setValue("price", editPhoto.price || "");
      // Don't set file_type for edit mode as it's not editable
      
      // Set preview for existing file
      if (editPhoto.file) {
        setPreviewUrl(editPhoto.file);
      }
    } else {
      // Reset form for create mode
      reset({
        title: "",
        description: "",
        file_type: undefined,
        is_public: "true",
        price: "",
      });
      setSelectedFile(null);
      setPreviewUrl("");
    }
  }, [editPhoto, setValue, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type matches selected file_type
      if (!isEditMode) {
        const fileType = watchedFileType;
        const typeChecks = {
          image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
          audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"],
          video: ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm"],
          pdf: ["application/pdf"],
          docx: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
          pptx: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
          xlsx: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
          other: ["text/plain", "application/octet-stream"],
        };

        const allowedTypes = typeChecks[fileType as keyof typeof typeChecks] || [];
        if (!allowedTypes.includes(file.type)) {
          alert(`選択したファイルタイプ（${fileType}）と一致しません。適切なファイルを選択してください。`);
          e.target.value = "";
          return;
        }
      }

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
    reset({
      title: "",
      description: "",
      file_type: undefined, // No default file type
      is_public: "true",
      price: "",
    });
    setSelectedFile(null);
    setPreviewUrl("");
    setIsSubmitting(false);
  };

  // Explicitly set file_type in the payload to ensure synchronization
  const handleFormSubmit = async (data: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log("Form data before submission:", data); // Debugging log

    // Validate private files have price
    if (data.is_public === "false" && (!data.price || data.price.trim() === "")) {
      alert("非公開ファイルには価格を設定してください。");
      setIsSubmitting(false);
      return;
    }

    // Ensure file_type matches the dropdown selection for create mode
    const fileType = watchedFileType;
    if (!isEditMode) {
      if (!fileType) {
        alert("ファイルタイプを選択してください。");
        setIsSubmitting(false);
        return;
      }
      data.file_type = fileType; // Explicitly set file_type in the payload

      // Validate file_type matches the uploaded file's MIME type
      if (selectedFile) {
        const typeChecks = {
          image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
          audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"],
          video: ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm"],
          pdf: ["application/pdf"],
          docx: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
          pptx: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
          xlsx: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
          other: ["text/plain", "application/octet-stream"],
        };

        const allowedTypes = typeChecks[fileType as keyof typeof typeChecks] || [];
        if (!allowedTypes.includes(selectedFile.type)) {
          alert(`選択したファイルタイプ（${fileType}）と一致しません。適切なファイルを選択してください。`);
          setIsSubmitting(false);
          return;
        }
      }
    }

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
      title={isEditMode ? "ファイルを編集" : "新しいファイルをアップロード"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* File Type Selector */}
        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ファイルタイプ
            </label>
            <select
              value={watchedFileType || ""} // Empty string if no value is selected
              onChange={(e) => {
                console.log("Select changed to:", e.target.value);
                setValue("file_type", e.target.value as any, { shouldValidate: true });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>ファイルタイプを選択してください</option> {/* Placeholder option */}
              <option value="image">画像</option>
              <option value="audio">音声</option>
              <option value="video">動画</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word文書</option>
              <option value="pptx">PowerPoint</option>
              <option value="xlsx">Excel</option>
              <option value="other">その他</option>
            </select>
            {errors.file_type?.message && (
              <p className="mt-1 text-sm text-red-600">{errors.file_type.message}</p>
            )}
          </div>
        )}

        {/* File Upload */}
          <Input
            label={
              isEditMode ? "ファイル（変更する場合のみ）" : "ファイル"
            }
            type="file"
            accept={isEditMode ? "image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" : (watchedFileType ? getAcceptAttribute(watchedFileType) : "*/*")}
            onChange={handleFileChange}
            error={!isEditMode ? (errors.file?.message as string) : undefined}
          />

        {/* Preview */}
        {(previewUrl || (isEditMode && editPhoto?.file)) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プレビュー
            </label>
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
              {/* Show new file preview if available */}
              {selectedFile && selectedFile.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="max-h-full max-w-full object-contain"
                />
              ) : selectedFile && selectedFile.type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-full max-w-full"
                />
              ) : selectedFile && selectedFile.type.startsWith('audio/') ? (
                <audio
                  src={previewUrl}
                  controls
                  className="w-full"
                />
              ) : selectedFile ? (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : /* Show existing file preview in edit mode */ isEditMode && editPhoto?.file ? (
                editPhoto.file_type === 'image' ? (
                  <img
                    src={editPhoto.file}
                    alt="現在のファイル"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : editPhoto.file_type === 'video' ? (
                  <video
                    src={editPhoto.file}
                    controls
                    className="max-h-full max-w-full"
                  />
                ) : editPhoto.file_type === 'audio' ? (
                  <audio
                    src={editPhoto.file}
                    controls
                    className="w-full"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{editPhoto.title}</p>
                    <p className="text-xs text-gray-400 mt-1">現在のファイル</p>
                  </div>
                )
              ) : null}
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label="タイトル"
          placeholder="ファイルのタイトルを入力"
          register={register("title")}
          error={errors.title?.message}
        />

        {/* Description */}
        <Textarea
          label="説明（オプション）"
          placeholder="ファイルの説明を入力"
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

        {/* Price - Only show for private files */}
        {watch("is_public") === "false" && (
          <Input
            label="価格 *"
            placeholder="販売価格を入力（例: 1000）"
            register={register("price", {
              required: watch("is_public") === "false" ? "非公開ファイルには価格が必要です" : false,
              pattern: {
                value: /^\d+(\.\d{1,2})?$/,
                message: "有効な価格を入力してください"
              }
            })}
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
