import type { Invitation, InvitationWithBooking } from '@shared/types';
import { api } from './client';
import { mocks } from './mocks';

export async function createInvitation(
  token: string | null,
  body: { booking_id: number; user_id: number; role: 'спикер' | 'слушатель'; message?: string }
): Promise<Invitation> {
  try {
    return await api.post<Invitation>('/api/invitations', body, token ?? undefined);
  } catch {
    return {
      id: 99,
      booking_id: body.booking_id,
      user_id: body.user_id,
      role: body.role,
      message: body.message,
      status: 'ожидает',
      created_at: new Date().toISOString(),
    };
  }
}

export async function getMyInvitations(
  token: string | null,
  status?: 'ожидает' | 'принято' | 'отклонено'
): Promise<InvitationWithBooking[]> {
  try {
    const q = status ? `?status=${status}` : '';
    return await api.get<InvitationWithBooking[]>(`/api/invitations/my${q}`, token ?? undefined);
  } catch {
    return mocks.myInvitations;
  }
}

export async function getInvitationsByBooking(bookingId: number, token: string | null): Promise<Invitation[]> {
  try {
    return await api.get<Invitation[]>(`/api/invitations/booking/${bookingId}`, token ?? undefined);
  } catch {
    return mocks.invitationsByBooking;
  }
}

export async function acceptInvitation(id: number, token: string | null): Promise<void> {
  try {
    await api.patch(`/api/invitations/${id}/accept`, undefined, token ?? undefined);
  } catch {
  }
}

export async function declineInvitation(id: number, token: string | null): Promise<void> {
  try {
    await api.patch(`/api/invitations/${id}/decline`, undefined, token ?? undefined);
  } catch {
  }
}

export async function updateInvitationRole(
  id: number,
  role: 'спикер' | 'слушатель',
  token: string | null
): Promise<Invitation> {
  try {
    return await api.patch<Invitation>(`/api/invitations/${id}`, { role }, token ?? undefined);
  } catch {
    return { id, booking_id: 0, user_id: 0, role, status: 'ожидает', created_at: new Date().toISOString() };
  }
}
