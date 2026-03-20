import { makeAutoObservable, runInAction } from 'mobx';
import type { Booking, LoginDto, TokensDto, UserProfile } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function apiJson<T>(path: string, opts: RequestInit & { token?: string | null } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  const { token, ...init } = opts;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const ct = res.headers.get('content-type');
  const data = ct?.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    throw new Error((data as { title?: string }).title ?? `Ошибка ${res.status}`);
  }
  return data as T;
}

const CACHE_MS = 60_000;

export class AppStore {
  accessToken: string | null = localStorage.getItem('accessToken');
  refreshToken: string | null = localStorage.getItem('refreshToken');
  ready = false;
  profile: UserProfile | null = null;
  myBookings: Booking[] = [];
  private profileFetchedAt = 0;
  private bookingsFetchedAt = 0;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated() {
    return !!this.accessToken;
  }

  private setTokens(t: TokensDto) {
    this.accessToken = t.accessToken;
    this.refreshToken = t.refreshToken;
    localStorage.setItem('accessToken', t.accessToken);
    localStorage.setItem('refreshToken', t.refreshToken);
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.profile = null;
    this.myBookings = [];
    this.profileFetchedAt = 0;
    this.bookingsFetchedAt = 0;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async bootstrap() {
    if (!this.refreshToken) {
      runInAction(() => {
        this.ready = true;
      });
      return;
    }
    try {
      const t = await apiJson<TokensDto>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      runInAction(() => {
        this.setTokens(t);
        this.ready = true;
      });
    } catch {
      runInAction(() => {
        this.clearAuth();
        this.ready = true;
      });
    }
  }

  async login(body: LoginDto) {
    const t = await apiJson<TokensDto>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    runInAction(() => {
      this.setTokens(t);
    });
    await this.loadProfile(true);
    await this.loadMyBookings(true);
  }

  async logout() {
    if (this.refreshToken && this.accessToken) {
      try {
        await apiJson('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
          token: this.accessToken,
        });
      } catch {
        /* noop */
      }
    }
    runInAction(() => this.clearAuth());
  }

  async loadProfile(force = false) {
    if (!this.accessToken) return;
    const now = Date.now();
    if (!force && this.profile && now - this.profileFetchedAt < CACHE_MS) return;
    const p = await apiJson<UserProfile>('/api/auth/me', { token: this.accessToken });
    runInAction(() => {
      this.profile = p;
      this.profileFetchedAt = Date.now();
    });
  }

  async loadMyBookings(force = false) {
    if (!this.accessToken) return;
    const now = Date.now();
    if (!force && this.bookingsFetchedAt > 0 && now - this.bookingsFetchedAt < CACHE_MS) return;
    const list = await apiJson<Booking[]>('/api/bookings/my', { token: this.accessToken });
    runInAction(() => {
      this.myBookings = list;
      this.bookingsFetchedAt = Date.now();
    });
  }

  async changePassword(body: { oldPassword: string; newPassword: string; confirmPassword: string }) {
    await apiJson('/api/auth/me/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
      token: this.accessToken,
    });
    runInAction(() => this.clearAuth());
  }
}

export const appStore = new AppStore();
