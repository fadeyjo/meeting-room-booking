import type { User, CreateUserDto, UpdateUserDto } from '@shared/types';
import { api } from './client';
import { mocks } from './mocks';

function onlyActive(users: User[]) {
  return users.filter((u) => !u.firedAt);
}

export async function getUsers(token: string | null): Promise<User[]> {
  try {
    return await api.get<User[]>('/api/auth/users', token ?? undefined);
  } catch {
    return mocks.users;
  }
}

export async function searchUsers(q: string, token: string | null): Promise<User[]> {
  try {
    return await api.get<User[]>(`/api/auth/users/search?q=${encodeURIComponent(q)}`, token ?? undefined);
  } catch {
    if (!q.trim()) return [];
    return onlyActive(
      mocks.users.filter(
        (u: User) =>
          u.lastName.toLowerCase().includes(q.toLowerCase()) ||
          u.firstName.toLowerCase().includes(q.toLowerCase()) ||
          u.position.toLowerCase().includes(q.toLowerCase())
      )
    );
  }
}

export async function createUser(token: string | null, body: CreateUserDto): Promise<User> {
  try {
    return await api.post<User>('/api/auth/users', body, token ?? undefined);
  } catch {
    return {
      id: 99,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      patronymic: body.patronymic,
      position: body.position,
      role: body.roleName,
    };
  }
}

export async function updateUser(token: string | null, id: number, body: UpdateUserDto): Promise<User> {
  try {
    return await api.patch<User>(`/api/auth/users/${id}`, body, token ?? undefined);
  } catch {
    return {
      id,
      email: body.email ?? '',
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      patronymic: body.patronymic,
      position: body.position ?? '',
      role: body.roleName,
      firedAt: body.firedAt ?? undefined,
    };
  }
}
