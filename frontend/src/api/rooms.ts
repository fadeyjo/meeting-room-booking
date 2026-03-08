import type { Room } from '@shared/types';
import { api } from './client';
import { mocks } from './mocks';

export async function getRooms(token: string | null, params?: { floor?: number; is_active?: boolean }): Promise<Room[]> {
  try {
    const q = new URLSearchParams();
    if (params?.floor != null) q.set('floor', String(params.floor));
    if (params?.is_active != null) q.set('is_active', String(params.is_active));
    const query = q.toString();
    return await api.get<Room[]>(`/api/rooms${query ? `?${query}` : ''}`, token ?? undefined);
  } catch {
    return mocks.rooms;
  }
}

export async function getRoom(id: number, token: string | null): Promise<Room | null> {
  try {
    return await api.get<Room>(`/api/rooms/${id}`, token ?? undefined);
  } catch {
    return mocks.rooms.find((r: Room) => r.id === id) ?? mocks.rooms[0];
  }
}
