import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { getUser } from "../api/user.api";

export const useUserData = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const token = await getToken();

            if (!token) throw new Error("No auth token");

            const user = await getUser(token);

            return user ?? null; // ✅ never undefined
        },
    });
};
