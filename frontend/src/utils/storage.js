const ACCESS_TOKEN_KEY = "ems_access_token";
const REFRESH_TOKEN_KEY = "ems_refresh_token";
const USER_KEY = "ems_user";

/*
|--------------------------------------------------------------------------
| Access token
|--------------------------------------------------------------------------
*/

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token) => {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/*
|--------------------------------------------------------------------------
| Refresh token
|--------------------------------------------------------------------------
*/

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token) => {
  if (!token) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

/*
|--------------------------------------------------------------------------
| User
|--------------------------------------------------------------------------
*/

export const getStoredUser = () => {
  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/*
|--------------------------------------------------------------------------
| Authentication tokens
|--------------------------------------------------------------------------
*/

export const setAuthTokens = ({
  accessToken,
  refreshToken
}) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/*
|--------------------------------------------------------------------------
| Complete auth state
|--------------------------------------------------------------------------
*/

export const setAuthStorage = ({
  accessToken,
  refreshToken,
  user
}) => {
  setAuthTokens({
    accessToken,
    refreshToken
  });

  setStoredUser(user);
};

/*
|--------------------------------------------------------------------------
| Clear authentication
|--------------------------------------------------------------------------
*/

export const clearAuthStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/*
|--------------------------------------------------------------------------
| Check authentication
|--------------------------------------------------------------------------
*/

export const hasAuthTokens = () => {
  return Boolean(
    getAccessToken() &&
    getRefreshToken()
  );
};