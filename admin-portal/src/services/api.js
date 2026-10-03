import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5001/api/v1";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (
            error.response?.status === 401 &&
            localStorage.getItem("refreshToken")
        ) {
            try {
                const response =
                    await axios.post(
                        `${API_URL}/auth/refresh`,
                        {
                            refreshToken:
                                localStorage.getItem(
                                    "refreshToken"
                                ),
                        }
                    );

                const newToken =
                    response.data?.data?.accessToken;

                if (newToken) {
                    localStorage.setItem(
                        "accessToken",
                        newToken
                    );

                    error.config.headers.Authorization =
                        `Bearer ${newToken}`;

                    return api(error.config);
                }
            } catch {
                localStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "refreshToken"
                );

                localStorage.removeItem("user");

                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;