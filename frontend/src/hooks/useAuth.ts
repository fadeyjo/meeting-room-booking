import { useCallback, useMemo } from 'react';
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  clearAuth,
  selectAuthRole,
  selectPersonId,
  setCredentials,
  setDemoCredentials,
  setReady,
} from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { apiSlice, useLoginMutation, useLogoutMutation, useRefreshMutation } from '../store/apiSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, isReady, isDemo } = useAppSelector((s) => s.auth);
  const role = useAppSelector(selectAuthRole);
  const personId = useAppSelector(selectPersonId);

  const [loginMut] = useLoginMutation();
  const [refreshMut] = useRefreshMutation();
  const [logoutMut] = useLogoutMutation();

  const login = useCallback(
    async (email: string, password: string) => {
      if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
        dispatch(setDemoCredentials());
        return;
      }
      const tokens = await loginMut({ email, password }).unwrap();
      dispatch(setCredentials(tokens));
    },
    [dispatch, loginMut]
  );

  const logout = useCallback(async () => {
    const refresh = refreshToken;
    const access = accessToken;
    if (refresh && access && !isDemo) {
      try {
        await logoutMut({ refreshToken: refresh }).unwrap();
      } catch {
        /* ignore */
      }
    }
    dispatch(clearAuth());
    dispatch(apiSlice.util.resetApiState());
  }, [dispatch, refreshToken, accessToken, isDemo, logoutMut]);

  const bootstrapRefresh = useCallback(async () => {
    if (isDemo) {
      dispatch(setReady(true));
      return;
    }
    if (!refreshToken) {
      dispatch(setReady(true));
      return;
    }
    try {
      const tokens = await refreshMut({ refreshToken }).unwrap();
      dispatch(setCredentials(tokens));
    } catch {
      dispatch(clearAuth());
    } finally {
      dispatch(setReady(true));
    }
  }, [dispatch, refreshToken, isDemo, refreshMut]);

  return useMemo(
    () => ({
      accessToken,
      refreshToken,
      isReady,
      isDemo,
      role,
      personId,
      isAuthenticated: !!accessToken,
      isAdmin: role === 'Admin',
      login,
      logout,
      bootstrapRefresh,
    }),
    [accessToken, refreshToken, isReady, isDemo, role, personId, login, logout, bootstrapRefresh]
  );
}
