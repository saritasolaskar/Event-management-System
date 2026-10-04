
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const STORAGE_KEYS = {
  accessToken: "ems_accessToken",
  refreshToken: "ems_refreshToken",
  user: "ems_user",
};

function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

function getStoredUser() {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.user);

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function saveAuthData(data) {
  if (!data) return;

  if (data.accessToken) {
    localStorage.setItem(
      STORAGE_KEYS.accessToken,
      data.accessToken
    );
  }

  if (data.refreshToken) {
    localStorage.setItem(
      STORAGE_KEYS.refreshToken,
      data.refreshToken
    );
  }

  if (data.user) {
    localStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify(data.user)
    );
  }
}

function clearAuthData() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? { message: text } : {};
}

function getErrorMessage(data, fallback) {
  if (!data) {
    return fallback;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((error) => {
        if (typeof error === "string") {
          return error;
        }

        return (
          error.message ||
          error.msg ||
          error.path ||
          "Validation error"
        );
      })
      .join(", ");
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  return fallback;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    /*
      Backend success responses are expected to contain:

      {
        success: true,
        message: "...",
        data: {
          accessToken,
          refreshToken
        }
      }

      We also support a direct response shape so that the
      frontend remains tolerant of small backend response
      differences.
    */

    const authData =
      data?.data || data;

    if (!authData?.accessToken) {
      clearAuthData();
      return null;
    }

    saveAuthData(authData);

    return authData.accessToken;
  } catch {
    clearAuthData();
    return null;
  }
}

let refreshPromise = null;

async function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function apiRequest(
  path,
  options = {},
  retry = true
) {
  const token = getAccessToken();

  const headers = new Headers(
    options.headers || {}
  );

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401 && retry) {
    const newAccessToken =
      await getFreshAccessToken();

    if (newAccessToken) {
      return apiRequest(
        path,
        options,
        false
      );
    }

    clearAuthData();
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(
        data,
        `Request failed with status ${response.status}`
      )
    );

    error.status = response.status;
    error.response = data;

    throw error;
  }

  return data;
}

async function login(email, password) {
  const response = await apiRequest(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
    false
  );

  const authData =
    response?.data || response;

  if (
    !authData?.accessToken ||
    !authData?.refreshToken ||
    !authData?.user
  ) {
    throw new Error(
      "Login succeeded but the server returned an incomplete authentication response."
    );
  }

  saveAuthData(authData);

  return authData;
}

async function register(userData) {
  const response = await apiRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(userData),
    },
    false
  );

  return response?.data || response;
}

async function logout() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await apiRequest(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({
            refreshToken,
          }),
        },
        false
      );
    }
  } finally {
    clearAuthData();
  }
}

async function logoutAllDevices() {
  try {
    return await apiRequest(
      "/auth/logout-all",
      {
        method: "POST",
      },
      true
    );
  } finally {
    clearAuthData();
  }
}

async function setPassword(token, password) {
  const response = await apiRequest(
    "/auth/set-password",
    {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
      }),
    },
    false
  );

  return response?.data || response;
}

const api = {
  request: apiRequest,

  auth: {
    login,
    register,
    logout,
    logoutAllDevices,
    setPassword,
    refreshAccessToken:
      getFreshAccessToken,
  },

  storage: {
    getAccessToken,
    getRefreshToken,
    getStoredUser,
    saveAuthData,
    clearAuthData,
  },

  baseURL: API_BASE_URL,
};

export default api;
