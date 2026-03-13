import { BookingDetail } from "./bookings"

export interface InviteDto {
    booking_id: number,
    user_id: number,
    role: string,
    message: string
}

export interface InvitationDetail {
    id: number,
    booking_id: number,
    user_id: number,
    role: string,
    message: string,
    status: string,
    created_at: string,
    firstName?: string,
    lastName?: string,
    patronymic?: string | null
}

export interface MyInviteDto {
    id: number,
    booking: BookingDetail
    role: string,
    message: string,
    status: string
}

export interface RedactInvitationRole {
    role: string
}

export type InvitationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InvitationRequestDto {
    booking_id: number;
    user_id: number;
    role: string;
    message?: string;
}

export interface InvitationRequestItem {
    id: number;
    booking_id: number;
    requested_by_id: number;
    requested_by_name: string;
    guest_id: number;
    guest_name: string;
    role: string;
    message: string;
    status: InvitationRequestStatus;
    created_at: string;
    decided_at?: string | null;
}