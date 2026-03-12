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