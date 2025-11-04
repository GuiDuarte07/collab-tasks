import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handleConnect = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    const handleTaskCreated = (event: TaskCreatedEvent) => {
      console.log("Task created event:", event);
      toast.success(`Nova tarefa criada: ${event.title}`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    };

    const handleTaskUpdated = (event: TaskUpdatedEvent) => {
      console.log("Task updated event:", event);
      toast.info(`Tarefa atualizada: ${event.title}`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", event.taskId] });
    };

    const handleCommentNew = (event: CommentCreatedEvent) => {
      console.log("New comment event:", event);
      toast.info("Novo comentário adicionado");
      queryClient.invalidateQueries({ queryKey: ["comments", event.taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", event.taskId] });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("comment:new", handleCommentNew);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("comment:new", handleCommentNew);
    };
  }, [queryClient]);

  return { isConnected };
};
