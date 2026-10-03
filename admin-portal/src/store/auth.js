export const getUser = () => {
    try {
        return JSON.parse(
            localStorage.getItem("user")
        );
    } catch {
        return null;
    }
};

export const isAuthenticated = () => {
    return Boolean(
        localStorage.getItem("accessToken")
    );
};

export const saveAuth = ({
    accessToken,
    refreshToken,
    user,
}) => {
    if (accessToken) {
        localStorage.setItem(
            "accessToken",
            accessToken
        );
    }

    if (refreshToken) {
        localStorage.setItem(
            "refreshToken",
            refreshToken
        );
    }

    if (user) {
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );
    }
};

export const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
};