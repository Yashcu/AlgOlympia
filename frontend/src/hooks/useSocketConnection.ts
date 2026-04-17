import { useEffect } from "react";
import { socket } from "../lib/socket";
import { useAuth } from "@clerk/clerk-react";

export const useSocketConnection = (userId?: string) => {
    const { getToken } = useAuth();

    useEffect(() => {
        if (!userId) return;

        const connectSocket = async () => {
            if (!socket.connected) {
                const token = await getToken();
                if (token) {
                    socket.auth = { token };
                    socket.connect();
                }
            }
        };

        connectSocket();

        return () => {
            socket.disconnect();
        };
    }, [userId, getToken]);
};
