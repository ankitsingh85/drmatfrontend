import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SOCKET_URL
    : "http://localhost:5000";

export const socket = io(SOCKET_URL!, {
  transports: ["websocket"],
  secure: process.env.NODE_ENV === "production",
  reconnection: true,
  /////////////
});