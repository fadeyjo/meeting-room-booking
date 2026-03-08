import type { LoginDto, TokensDto } from '@shared/types';
import { api } from './client';

export const authApi = {
  login: (body: LoginDto) => api.post<TokensDto>('/api/auth/login', body),
  logout: (refreshToken: string, accessToken: string) =>
    api.post<{ personId: number }>('/api/auth/logout', { refreshToken }, accessToken),
  refresh: (refreshToken: string) => api.post<TokensDto>('/api/auth/refresh', { refreshToken }),
};
