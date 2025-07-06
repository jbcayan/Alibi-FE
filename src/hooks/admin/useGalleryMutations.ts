import { galleryAPIClient } from "@/infrastructure/gallery/galleryAPIClient";
import { GALLERY_QUERY_KEYS } from "@/infrastructure/gallery/utils/keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useCreatePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: galleryAPIClient.createPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GALLERY_QUERY_KEYS.default(),
      });
      toast.success("写真をアップロードしました");
    },
    onError: (error: Error) => {
      toast.error(error.message || "アップロードに失敗しました");
    },
  });
};

export const useUpdatePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uid,
      data,
    }: {
      uid: string;
      data: {
        title: string;
        description: string;
        status?: string;
        price?: string;
      };
    }) => galleryAPIClient.updatePhoto(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GALLERY_QUERY_KEYS.default(),
      });
      toast.success("写真を更新しました");
    },
    onError: (error: Error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: galleryAPIClient.deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GALLERY_QUERY_KEYS.default(),
      });
      toast.success("写真を削除しました");
    },
    onError: (error: Error) => {
      toast.error(error.message || "削除に失敗しました");
    },
  });
};
