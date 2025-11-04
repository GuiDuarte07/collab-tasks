import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TaskComment } from "@/types";

export interface PaginatedComments {
  data: TaskComment[];
  total: number;
  page: number;
  size: number;
}

export function useComments(taskId: string, page: number, size: number) {
  return useQuery({
    queryKey: ["comments", taskId, page, size],
    queryFn: async (): Promise<PaginatedComments> => {
      const { data } = await api.get(`/tasks/${taskId}/comments`, {
        params: { page, size },
      });
      return data;
    },
    enabled: !!taskId,
    staleTime: 5_000,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string): Promise<TaskComment> => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}
