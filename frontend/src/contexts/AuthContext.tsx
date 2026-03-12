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

function decodePayload(accessToken: string): { role: 'Admin' | 'User'; personId: number | null } {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return { role: 'User', personId: null };
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json) as { personId?: number; roleId?: number; role?: string; roleName?: string };
    const role: 'Admin' | 'User' =
      typeof data.roleId === 'number' && data.roleId === 2 ? 'Admin'
      : (data.role ?? data.roleName ?? '') === 'Admin' ? 'Admin' : 'User';
    const personId = typeof data.personId === 'number' ? data.personId : null;
    return { role, personId };
  } catch {
    return { role: 'User', personId: null };
  }
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  role: 'Admin' | 'User';
  personId: number | null;
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
    const decoded = access ? decodePayload(access) : { role: 'User' as const, personId: null };
    return {
      accessToken: access,
      refreshToken: localStorage.getItem(REFRESH_KEY),
      isReady: false,
      role: decoded.role,
      personId: decoded.personId,
    };
  });

  const persistTokens = useCallback((access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    const { role, personId } = decodePayload(access);
    setState((s) => ({ ...s, accessToken: access, refreshToken: refresh, role, personId }));
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
      personId: null,
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
