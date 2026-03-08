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
const DEMO_USER_KEY = 'demoUser';
const DEMO_USER_EMAIL = 'user@mail.ru';
const DEMO_USER_PASSWORD = 'user-123';

function fakeJwtWithRole(roleId: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '');
  const payload = btoa(JSON.stringify({ personId: 999, roleId })).replace(/=+$/, '');
  return `${header}.${payload}.x`;
}

function decodeRole(accessToken: string): 'Admin' | 'User' {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return 'User';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json) as { roleId?: number; role?: string; roleName?: string };
    if (typeof data.roleId === 'number' && data.roleId === 2) return 'Admin';
    const role = data.role ?? data.roleName ?? '';
    return role === 'Admin' ? 'Admin' : 'User';
  } catch {
    return 'User';
  }
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  role: 'Admin' | 'User';
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const access = localStorage.getItem(ACCESS_KEY);
    return {
      accessToken: access,
      refreshToken: localStorage.getItem(REFRESH_KEY),
      isReady: false,
      role: access ? decodeRole(access) : 'User',
    };
  });

  const persistTokens = useCallback((access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    setState((s) => ({ ...s, accessToken: access, refreshToken: refresh, role: decodeRole(access) }));
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
    setState((s) => ({
      ...s,
      accessToken: null,
      refreshToken: null,
      role: 'User',
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
    if (localStorage.getItem(DEMO_USER_KEY)) {
      setState((s) => ({ ...s, isReady: true }));
      return;
    }
    refreshTokens().finally(() => {
      setState((s) => ({ ...s, isReady: true }));
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
        localStorage.setItem(DEMO_USER_KEY, '1');
        persistTokens(fakeJwtWithRole(1), 'demo-refresh');
        return;
      }
      const tokens = await authApi.login({ email, password });
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
      isAdmin: state.role === 'Admin',
      login,
      logout,
    }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
