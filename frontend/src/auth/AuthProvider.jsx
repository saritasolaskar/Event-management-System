import {
  useCallback,
  useMemo,
  useState
} from "react";

import AuthContext from "./AuthContext";

import {
  loginUser,
  registerUser,
  logoutUser,
  logoutAllDevices
} from "../api/auth.api";

import {
  clearAuthentication,
  getInitialAuthState,
  saveAuthentication
} from "./auth.utils";

import {
  getRefreshToken,
  setAccessToken
} from "../utils/storage";

const AuthProvider = ({ children }) => {
  const initialState = getInitialAuthState();

  const [user, setUser] = useState(initialState.user);
  const [accessToken, setAccessTokenState] = useState(
    initialState.accessToken
  );

  const [isAuthenticated, setIsAuthenticated] = useState(
    initialState.isAuthenticated
  );

  const [isLoading, setIsLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const login = useCallback(async (credentials) => {
    setIsLoading(true);

    try {
      const response = await loginUser(credentials);

      const authData = response?.data;

      if (
        !authData?.user ||
        !authData?.accessToken ||
        !authData?.refreshToken
      ) {
        throw new Error(
          "Invalid login response received from the server."
        );
      }

      const state = saveAuthentication(authData);

      setUser(state.user);
      setAccessTokenState(state.accessToken);
      setIsAuthenticated(true);

      return {
        success: true,
        user: state.user
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Register
  |--------------------------------------------------------------------------
  */

  const register = useCallback(async (userData) => {
    setIsLoading(true);

    try {
      const response = await registerUser(userData);

      const authData = response?.data;

      if (
        !authData?.user ||
        !authData?.accessToken ||
        !authData?.refreshToken
      ) {
        throw new Error(
          "Invalid registration response received from the server."
        );
      }

      const state = saveAuthentication(authData);

      setUser(state.user);
      setAccessTokenState(state.accessToken);
      setIsAuthenticated(true);

      return {
        success: true,
        user: state.user
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch {
      /*
       * Even when the backend logout request fails,
       * the local session must still be cleared.
       */
    } finally {
      const state = clearAuthentication();

      setUser(state.user);
      setAccessTokenState(state.accessToken);
      setIsAuthenticated(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Logout all devices
  |--------------------------------------------------------------------------
  */

  const logoutEverywhere = useCallback(async () => {
    try {
      await logoutAllDevices();
    } finally {
      const state = clearAuthentication();

      setUser(state.user);
      setAccessTokenState(state.accessToken);
      setIsAuthenticated(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Update access token
  |--------------------------------------------------------------------------
  */

  const updateAccessToken = useCallback((token) => {
    setAccessToken(token);
    setAccessTokenState(token);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      logoutEverywhere,
      updateAccessToken
    }),
    [
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      logoutEverywhere,
      updateAccessToken
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;