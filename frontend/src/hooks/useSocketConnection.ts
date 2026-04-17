import { useEffect } from "react";
import { socket } from "../lib/socket";
import { useAuth } from "@clerk/clerk-react";

export const useSocketConnection = (userId?: string) => {
    const { getToken } = useAuth();

    useEffect(() => {
        if (!userId) {
            // User logged out — disconnect cleanly
            if (socket.connected) socket.disconnect();
            return;
        }

        const connectSocket = async () => {
            if (socket.connected) return; // already connected, don't re-auth

            const token = await getToken();
            if (token) {
                socket.auth = { token };
                socket.connect();
            }
        };

        connectSocket();

        // Do NOT disconnect on cleanup — the socket should stay alive
        // for the entire session. It's only killed above when userId is null.
    }, [userId, getToken]);
};
