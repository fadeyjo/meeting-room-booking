/** Разделяемые типы для backend и frontend */

export interface RegisterDto {
  email: string;
  phoneNumber: string;
  birth: string;
  lastName: string;
  firstName: string;
  patronymic?: string;
  position: string;
  password: string;
  roleName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutedDto {
  personId: number;
}

export interface ApiError {
  title: string;
  statusCode: number;
}
