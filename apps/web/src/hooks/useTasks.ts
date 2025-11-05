import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Task } from "@/types";

interface TaskFilters {
  page?: number;
  size?: number;
  status?: "backlog" | "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "deadline" | "priority" | "status";
  sortOrder?: "ASC" | "DESC";
}

interface TasksResponse {
  data: Task[];
  total: number;
  page: number;
  size: number;
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await api.get<TasksResponse>("/tasks", {
        params: { size: 100 },
      });
      return data.data;
    },
  });
}

export function useTasksWithFilters(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", "filtered", filters],
    queryFn: async () => {
      const { data } = await api.get<TasksResponse>("/tasks", {
        params: filters,
      });
      return data;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data } = await api.post<Task>("/tasks", task);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data } = await api.patch<Task>(`/tasks/${id}`, updates);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
