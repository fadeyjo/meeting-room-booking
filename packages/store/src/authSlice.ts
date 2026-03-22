import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TokensDto } from '@shared/types';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const DEMO_USER_KEY = 'demoUser';
export const DEMO_USER_EMAIL = 'user@mail.ru';
export const DEMO_USER_PASSWORD = 'user-123';

function fakeJwtWithRole(roleId: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '');
  const payload = btoa(JSON.stringify({ personId: 999, roleId })).replace(/=+$/, '');
  return `${header}.${payload}.x`;
}

export function decodePayload(accessToken: string): { role: 'Admin' | 'User'; personId: number | null } {
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

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  isDemo: boolean;
}

function readInitial(): AuthState {
  const access = localStorage.getItem(ACCESS_KEY);
  const isDemo = !!localStorage.getItem(DEMO_USER_KEY);
  return {
    accessToken: access,
    refreshToken: localStorage.getItem(REFRESH_KEY),
    isReady: false,
    isDemo,
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: readInitial(),
  reducers: {
    setCredentials(state, action: PayloadAction<TokensDto>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isDemo = false;
      localStorage.setItem(ACCESS_KEY, action.payload.accessToken);
      localStorage.setItem(REFRESH_KEY, action.payload.refreshToken);
      localStorage.removeItem(DEMO_USER_KEY);
    },
    setDemoCredentials(state) {
      state.accessToken = fakeJwtWithRole(1);
      state.refreshToken = 'demo-refresh';
      state.isDemo = true;
      localStorage.setItem(DEMO_USER_KEY, '1');
      localStorage.setItem(ACCESS_KEY, state.accessToken);
      localStorage.setItem(REFRESH_KEY, state.refreshToken);
    },
    clearAuth(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.isDemo = false;
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(DEMO_USER_KEY);
    },
    setReady(state, action: PayloadAction<boolean>) {
      state.isReady = action.payload;
    },
  },
});

export const { setCredentials, setDemoCredentials, clearAuth, setReady } = authSlice.actions;
export default authSlice.reducer;

export function selectAuthRole(state: { auth: AuthState }): 'Admin' | 'User' {
  const { accessToken, isDemo } = state.auth;
  if (isDemo) return 'User';
  if (!accessToken) return 'User';
  return decodePayload(accessToken).role;
}

export function selectPersonId(state: { auth: AuthState }): number | null {
  const { accessToken, isDemo } = state.auth;
  if (isDemo) return 999;
  if (!accessToken) return null;
  return decodePayload(accessToken).personId;
}
