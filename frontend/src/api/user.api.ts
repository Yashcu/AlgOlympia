import { apiRequest } from "../lib/api";
import type { User } from "../types/team";

export const getUser = async (t: string): Promise<User> => {
    return await apiRequest("/user/me", t);
};
