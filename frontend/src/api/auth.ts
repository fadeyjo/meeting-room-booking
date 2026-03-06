import type { LoginDto, RegisterDto, TokensDto } from '@shared/types';
import { api } from './client';

export const authApi = {
  login: (body: LoginDto) =>
    api.post<TokensDto>('/api/auth/login', body),

  register: (body: RegisterDto) =>
    api.post<TokensDto>('/api/auth/register', body),

  logout: (refreshToken: string, accessToken: string) =>
    api.post<{ personId: number }>('/api/auth/logout', { refreshToken }, accessToken),

  refresh: (refreshToken: string) =>
    api.post<TokensDto>('/api/auth/refresh', { refreshToken }),
};
