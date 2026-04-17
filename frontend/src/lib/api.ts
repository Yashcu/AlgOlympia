const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL is not defined");
}

export async function apiRequest(
    url: string,
    token: string,
    options: RequestInit = {}
) {
    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(data?.message || "REQUEST_FAILED") as Error & {
            code?: string;
        };

        err.code = data?.code || "UNKNOWN_ERROR";
        throw err;
    }

    return data;
}
