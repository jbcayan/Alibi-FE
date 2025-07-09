import { galleryAPIClient } from "@/infrastructure/gallery/galleryAPIClient";
import { GALLERY_QUERY_KEYS } from "@/infrastructure/gallery/utils/keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Types for mutations
interface CreatePhotoData {
  title: string;
  description: string;
  file: File;
}

interface UpdatePhotoData {
  uid: string;
  data: {
    title: string;
    description: string;
    category: string;
    file?: File;
  };
}

export const useCreatePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePhotoData) => {
      return await galleryAPIClient.createPhoto(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GALLERY_QUERY_KEYS.default(),
      });
      // Don't show toast here - let the component handle it
    },
    onError: (error: Error) => {
      console.error("Create photo failed:", error);
      // Don't show toast here - let the component handle it
      throw error;
    },
  });
};

export const useUpdatePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, data }: UpdatePhotoData) => {
      return await galleryAPIClient.updatePhoto(uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GALLERY_QUERY_KEYS.default(),
      });
      // Don't show toast here - let the component handle it
    },
    onError: (error: Error) => {
      console.error("Update photo failed:", error);
      // Don't show toast here - let the component handle it
      throw error;
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uid: string) => {
      return await galleryAPIClient.deletePhoto(uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GALLERY_QUERY_KEYS.default(),
      });
      // Don't show toast here - let the component handle it
    },
    onError: (error: Error) => {
      console.error("Delete photo failed:", error);
      // Don't show toast here - let the component handle it
      throw error;
    },
  });
};
