import { useEffect } from "react";
import { socket } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";

export const useTeamSocket = (
    teamId?: string,
    userId?: string
) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!teamId || !userId) return;

        if (!socket.connected) {
            socket.connect();
        }

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
        };

        socket.on("team:updated", handleUpdate);
        socket.emit("join_team", teamId);

        return () => {
            socket.emit("leave_team", teamId);
            socket.off("team:updated", handleUpdate);
        };
    }, [teamId, userId, queryClient]);
};
