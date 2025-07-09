"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import PhotoCard from "@/components/admin/photo-albums/PhotoCard";
import Button from "@/components/admin/ui/Button";
import PhotoUploadModal from "@/components/admin/photo-albums/PhotoUploadModal";
import { galleryAPIClient } from "@/infrastructure/gallery/galleryAPIClient";
import {
  useCreatePhoto,
  useUpdatePhoto,
  useDeletePhoto,
} from "@/hooks/admin/useGalleryMutations";
import { GALLERY_QUERIES } from "@/infrastructure/gallery/utils/queries";
import { UploadFormData } from "@/schemas/adminAlbumUpload";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { toast, ToastContainer } from "react-toastify";

const CategoryFilter: React.FC<{
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}> = ({ selectedCategory, onCategoryChange }) => (
  <select
    value={selectedCategory}
    onChange={(e) => onCategoryChange(e.target.value)}
    className="rounded-lg border border-gray-300 px-2 lg:px-3 w-30 lg:w-50 py-3"
  >
    <option value="all">すべてのカテゴリー</option>
    <option value="work">仕事</option>
    <option value="travel">旅行</option>
    <option value="event">イベント</option>
    <option value="other">その他</option>
  </select>
);

// Photo data interface
interface PhotoData {
  uid: string;
  title: string;
  description: string;
  file: string;
  category?: string;
  created_at?: string;
}

// Edit photo data interface
interface EditPhotoData {
  uid: string;
  title: string;
  description: string;
  category: string;
  file?: File;
}

// Main Component
const PhotoAlbumsMain: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editPhoto, setEditPhoto] = useState<PhotoData | null>(null);

  const createPhotoMutation = useCreatePhoto();
  const updatePhotoMutation = useUpdatePhoto();
  const deletePhotoMutation = useDeletePhoto();

  const {
    data: galleryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...GALLERY_QUERIES.getPhotos(currentPage, 20),
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      return !error?.message?.includes("認証が必要です") && failureCount < 3;
    },
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (savedToken) {
      galleryAPIClient.setAuthToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleUploadModalOpen = () => {
    setEditPhoto(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
    setEditPhoto(null);
  };

  const handlePhotoUpload = async (data: UploadFormData) => {
    try {
      await createPhotoMutation.mutateAsync({
        title: data.title,
        description: data.description || "",
        file: data.file,
      });
      toast.success("写真をアップロードしました");
      setIsUploadModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("アップロードに失敗しました");
    }
  };

  const handlePhotoUpdate = async (data: EditPhotoData) => {
    // debug
    // console.log({ UpdatingFromData: data });
    try {
      await updatePhotoMutation.mutateAsync({
        uid: data.uid,
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          file: data.file,
        },
      });
      toast.success("写真を更新しました");
      setIsUploadModalOpen(false);
      setEditPhoto(null);
      refetch();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("更新に失敗しました");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = confirm("この写真を削除してもよろしいですか？");
    if (!confirmed) return;

    try {
      await deletePhotoMutation.mutateAsync(photoId);
      toast.success("写真を削除しました");
      refetch();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("写真の削除に失敗しました");
    }
  };

  const handlePhotoEdit = (photo: any) => {
    setEditPhoto({
      uid: photo.uid,
      title: photo.title,
      description: photo.description || "",
      file: photo.file,
      category: photo.category || "other",
    });
    setIsUploadModalOpen(true);
  };

  const handleRetry = () => {
    refetch();
  };

  // Filter photos by category
  const filteredPhotos = React.useMemo(() => {
    const photos = galleryData?.results || [];
    if (selectedCategory === "all") return photos;
    return photos.filter((photo: any) => photo.category === selectedCategory);
  }, [galleryData?.results, selectedCategory]);

  const isUploading = createPhotoMutation.isPending;
  const isUpdating = updatePhotoMutation.isPending;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            認証が必要です
          </h2>
          <p className="text-gray-600">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen lg:p-4 bg-white">
      <div className="flex-1">
        <div className="mb-8">
          <Breadcrumbs
            items={[{ label: "写真アルバム", href: "/admin/photo-albums" }]}
            homeHref="/admin"
          />
        </div>

        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-2xl font-medium text-gray-800">
            写真アルバム管理
          </h1>
        </header>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <main className="lg:p-6 p-3">
          <div className="mb-6 flex items-center justify-between">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <Button
              variant="primary"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={handleUploadModalOpen}
              disabled={isUploading || isUpdating}
            >
              {isUploading ? "アップロード中..." : "新規写真をアップロード"}
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500 flex items-center justify-between">
              <span>{error.message}</span>
              <Button variant="secondary" onClick={handleRetry}>
                再試行
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredPhotos.map((photo: any) => (
                  <PhotoCard
                    key={photo.uid}
                    photo={{
                      id: photo.uid,
                      url: photo.file,
                      title: photo.title,
                      created_at: photo.created_at || new Date().toISOString(),
                    }}
                    onUpdate={() => handlePhotoEdit(photo)}
                    onDelete={() => handleDeletePhoto(photo.uid)}
                    isUpdating={isUpdating}
                  />
                ))}
                {filteredPhotos.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    {selectedCategory === "all"
                      ? "写真が見つかりません"
                      : "このカテゴリーに写真がありません"}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {galleryData && (galleryData.next || galleryData.previous) && (
                <div className="mt-6 flex justify-center space-x-2">
                  <Button
                    variant="secondary"
                    disabled={!galleryData.previous || isLoading}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    前のページ
                  </Button>
                  <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                    ページ {currentPage}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={!galleryData.next || isLoading}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    次のページ
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onSubmit={handlePhotoUpload}
        onUpdate={handlePhotoUpdate}
        editPhoto={editPhoto}
      />
    </div>
  );
};

export default PhotoAlbumsMain;
