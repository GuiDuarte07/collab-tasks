import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: {
      token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ WebSocket conectado");
  });

  socket.on("disconnect", () => {
    console.log("❌ WebSocket desconectado");
  });

  socket.on("connect_error", (error) => {
    console.error("Erro de conexão do WebSocket:", error);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
};
