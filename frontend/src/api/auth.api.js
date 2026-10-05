import api from "./axios";

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Refresh token
|--------------------------------------------------------------------------
*/

export const refreshAccessToken = async (refreshToken) => {
  const response = await api.post("/auth/refresh", {
    refreshToken
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const logoutUser = async (refreshToken) => {
  const response = await api.post("/auth/logout", {
    refreshToken
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Logout all devices
|--------------------------------------------------------------------------
*/

export const logoutAllDevices = async () => {
  const response = await api.post("/auth/logout-all");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Set password
|--------------------------------------------------------------------------
*/

try {
  await setPassword(token, password);

  setSuccess(
    "Password created successfully. You can now sign in."
  );

  setTimeout(() => {
    navigate("/login", { replace: true });
  }, 1200);
} catch (err) {
  setError(getApiErrorMessage(err));
} finally {
  setIsSubmitting(false);
}