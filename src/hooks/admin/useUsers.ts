import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user/types";
import { productAPIClient } from "@/infrastructure/admin/adminAPIClient";

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      return await productAPIClient.getAdminUsers();
    },
    staleTime: 1000 * 60 * 5, // 5 mins
    refetchOnWindowFocus: false,
  });
};
