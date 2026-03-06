import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: import('@shared/types').RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
    isReady: false,
  });

  const persistTokens = useCallback((access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    setState((s) => ({ ...s, accessToken: access, refreshToken: refresh }));
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setState((s) => ({
      ...s,
      accessToken: null,
      refreshToken: null,
    }));
  }, []);

  const refreshTokens = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      clearTokens();
      return;
    }
    try {
      const tokens = await authApi.refresh(refresh);
      persistTokens(tokens.accessToken, tokens.refreshToken);
    } catch {
      clearTokens();
    }
  }, [clearTokens, persistTokens]);

  useEffect(() => {
    if (!state.refreshToken) {
      setState((s) => ({ ...s, isReady: true }));
      return;
    }
    refreshTokens().finally(() => {
      setState((s) => ({ ...s, isReady: true }));
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login({ email, password });
      persistTokens(tokens.accessToken, tokens.refreshToken);
    },
    [persistTokens]
  );

  const register = useCallback(
    async (data: import('@shared/types').RegisterDto) => {
      const tokens = await authApi.register(data);
      persistTokens(tokens.accessToken, tokens.refreshToken);
    },
    [persistTokens]
  );

  const logout = useCallback(async () => {
    const refresh = state.refreshToken;
    const access = state.accessToken;
    if (refresh && access) {
      try {
        await authApi.logout(refresh, access);
      } catch {
      }
    }
    clearTokens();
  }, [state.refreshToken, state.accessToken, clearTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.accessToken,
      login,
      register,
      logout,
    }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
