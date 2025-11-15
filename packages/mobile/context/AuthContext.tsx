import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getToken,
  getUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from "../lib/api";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  initializing: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const hydrateFromStorage = useCallback(async () => {
    try {
      const storedToken = await getToken();
      const storedUser = await getUser();

      setTokenState(storedToken);
      setUserState(storedUser);
    } catch (error) {
      console.error("[AuthContext] Failed to hydrate session", error);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setTokenState(data.accessToken);
      setUserState(data.user);
    } catch (error) {
      console.error("[AuthContext] Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const data = await apiRegister(payload);
      const resolvedToken = data.accessToken || data.token;
      if (resolvedToken) {
        setTokenState(resolvedToken);
      }
      setUserState(data.user);
    } catch (error) {
      console.error("[AuthContext] Registration failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setTokenState(null);
      setUserState(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const storedToken = await getToken();
    const storedUser = await getUser();
    setTokenState(storedToken);
    setUserState(storedUser);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      loading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [token, user, initializing, loading, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
