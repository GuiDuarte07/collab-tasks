import type { TaskStatus, TaskPriority } from "@/types";

export const STATUS_MAP: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Progresso",
  REVIEW: "Em Revisão",
  DONE: "Concluído",
};

export const PRIORITY_MAP: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-orange-400",
  HIGH: "bg-red-500",
  URGENT: "bg-red-700",
};

// Funções auxiliares
export const getStatusLabel = (status: TaskStatus): string => {
  return STATUS_MAP[status] || status;
};

export const getStatusColor = (status: TaskStatus): string => {
  return STATUS_COLORS[status] || "bg-gray-500";
};

export const getPriorityLabel = (priority: TaskPriority): string => {
  return PRIORITY_MAP[priority] || priority;
};

export const getPriorityColor = (priority: TaskPriority): string => {
  return PRIORITY_COLORS[priority] || "bg-gray-400";
};
