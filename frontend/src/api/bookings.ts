import type { Booking, BookingDetail, RoomWithSlots, SlotsByRoomResponse } from '@shared/types';
import { api } from './client';
import { mocks } from './mocks';

export async function createBooking(
  token: string | null,
  body: { room_id: number; title: string; description: string; date: string; start_time: string; end_time: string }
): Promise<Booking> {
  try {
    return await api.post<Booking>('/api/bookings', body, token ?? undefined);
  } catch {
    return {
      id: 99,
      room_id: body.room_id,
      creator_id: 0,
      title: body.title,
      description: body.description,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };
  }
}

export async function getMyBookings(token: string | null): Promise<Booking[]> {
  try {
    return await api.get<Booking[]>('/api/bookings/my', token ?? undefined);
  } catch {
    return mocks.bookings;
  }
}

export async function getMyMeetings(token: string | null): Promise<Booking[]> {
  try {
    return await api.get<Booking[]>('/api/bookings/my-meetings', token ?? undefined);
  } catch {
    return mocks.bookings;
  }
}

export async function getBooking(id: number, token: string | null): Promise<BookingDetail | null> {
  try {
    return await api.get<BookingDetail>(`/api/bookings/${id}`, token ?? undefined);
  } catch {
    return mocks.bookingDetail(id) as BookingDetail;
  }
}

export async function cancelBooking(id: number, token: string | null): Promise<void> {
  await api.delete(`/api/bookings/${id}`, token ?? undefined);
}

export async function getSlotsByRoom(roomId: number, date: string, token: string | null): Promise<SlotsByRoomResponse> {
  try {
    return await api.get<SlotsByRoomResponse>(`/api/bookings/room/${roomId}/slots?date=${date}`, token ?? undefined);
  } catch {
    return { free: mocks.slots, occupied: [] };
  }
}

export async function getRoomsByDate(date: string, token: string | null): Promise<RoomWithSlots[]> {
  try {
    return await api.get<RoomWithSlots[]>(`/api/bookings/by-date?date=${date}`, token ?? undefined);
  } catch {
    return mocks.byDate();
  }
}
