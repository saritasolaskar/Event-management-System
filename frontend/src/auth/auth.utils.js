import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  hasAuthTokens,
  setAuthStorage
} from "../utils/storage";

export const getInitialAuthState = () => {
  const user = getStoredUser();
  const accessToken = getAccessToken();

  if (!user || !accessToken || !hasAuthTokens()) {
    return {
      isAuthenticated: false,
      user: null,
      accessToken: null
    };
  }

  return {
    isAuthenticated: true,
    user,
    accessToken
  };
};

export const saveAuthentication = ({
  user,
  accessToken,
  refreshToken
}) => {
  setAuthStorage({
    user,
    accessToken,
    refreshToken
  });

  return {
    isAuthenticated: true,
    user,
    accessToken
  };
};

export const clearAuthentication = () => {
  clearAuthStorage();

  return {
    isAuthenticated: false,
    user: null,
    accessToken: null
  };
};

export const getUserRole = (user) => {
  return user?.role || null;
};