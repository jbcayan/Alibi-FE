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

// Gallery data interface
interface GalleryItem {
  uid: string;
  title: string;
  description: string;
  file: string;
  file_type: string;
  created_at?: string;
  is_public?: boolean;
  price?: string;
}

// Edit gallery data interface
interface EditGalleryItem {
  uid: string;
  title: string;
  description: string;
  file?: File;
  is_public?: boolean;
  price?: string;
}

// Edit photo data interface
interface EditPhotoData {
  uid: string;
  title: string;
  description: string;
  category: string;
  file?: File;
  is_public?: boolean;
  price?: string;
}

// Main Component
const GalleryManagement: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editGalleryItem, setEditGalleryItem] = useState<GalleryItem | null>(null);

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
    setEditGalleryItem(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
    setEditGalleryItem(null);
  };

  const handleGalleryUpload = async (data: any) => {
    try {
      await createPhotoMutation.mutateAsync({
        title: data.title,
        description: data.description || "",
        file: data.file,
        file_type: data.file_type,
        is_public: data.is_public,
        price: data.price,
      });
      toast.success("ファイルをアップロードしました");
      setIsUploadModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("アップロードに失敗しました");
    }
  };

  const handleGalleryUpdate = async (data: any) => {
    // debug
    // console.log({ UpdatingFromData: data });
    try {
      await updatePhotoMutation.mutateAsync({
        uid: data.uid,
        data: {
          title: data.title,
          description: data.description,
          is_public: data.is_public,
          price: data.price,
          file: data.file,
        },
      });
      toast.success("ファイルを更新しました");
      setIsUploadModalOpen(false);
      setEditGalleryItem(null);
      refetch();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("更新に失敗しました");
    }
  };

  const handleDeleteGalleryItem = async (itemId: string) => {
    const confirmed = confirm("このファイルを削除してもよろしいですか？");
    if (!confirmed) return;

    try {
      await deletePhotoMutation.mutateAsync(itemId);
      toast.success("ファイルを削除しました");
      refetch();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("ファイルの削除に失敗しました");
    }
  };

  const handleGalleryEdit = (item: any) => {
    setEditGalleryItem({
      uid: item.uid,
      title: item.title,
      description: item.description || "",
      file: item.file,
      file_type: item.file_type,
      is_public: item.is_public ?? true,
      price: item.price || "",
    });
    setIsUploadModalOpen(true);
  };

  const handleRetry = () => {
    refetch();
  };

  // Filter photos by category
  const filteredPhotos = React.useMemo(() => {
    return galleryData?.results || [];
  }, [galleryData?.results]);

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
            items={[{ label: "ギャラリー管理", href: "/admin/photo-albums" }]}
            homeHref="/admin"
          />
        </div>

        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-2xl font-medium text-gray-800">
            ギャラリー管理
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
            <div></div>

            <Button
              variant="primary"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={handleUploadModalOpen}
              disabled={isUploading || isUpdating}
            >
              {isUploading ? "アップロード中..." : "新規ファイルをアップロード"}
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
                      is_public: photo.is_public,
                      price: photo.price,
                      file_type: photo.file_type,
                    }}
                    onUpdate={() => handleGalleryEdit(photo)}
                    onDelete={() => handleDeleteGalleryItem(photo.uid)}
                  />
                ))}
                {filteredPhotos.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    ファイルが見つかりません
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
        onSubmit={handleGalleryUpload}
        onUpdate={handleGalleryUpdate}
        editPhoto={editGalleryItem}
      />
    </div>
  );
};

export default GalleryManagement;
