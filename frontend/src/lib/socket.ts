import { io } from "socket.io-client";

// Socket.io needs the base URL (http://localhost:5000), not the /api path.
const SOCKET_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

if (!SOCKET_URL) {
    throw new Error("VITE_API_URL is not defined");
}

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
