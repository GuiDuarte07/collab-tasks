import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

export const useUsers = (userIds: string[]) => {
  return useQuery({
    queryKey: ["users", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];

      const queries = userIds.map((userId) => ({ userId }));
      const { data } = await api.post<User[]>("/users/find-many", queries);
      return data;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUser = (userId?: string | null) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data } = await api.post<User[]>("/users/find-many", [{ userId }]);
      return data[0] || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
