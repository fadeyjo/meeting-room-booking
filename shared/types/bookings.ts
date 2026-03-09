import { RoomDetail } from "./rooms"

export interface NewBookingDto {
    room_id: number,
    title: string,
    description: string,
    date: string,
    start_time: string,
    end_time: string
}

export interface BookingDetail {
    id: number,
    room_id: number,
    creator_id: number,
    title: string,
    description: string,
    date: string,
    start_time: string,
    end_time: string,
    status: string,
    created_at: string
}

export interface TimeSlot {
    start_time: string,
    end_time: string
}

export interface RoomsSlotsDetails {
    room: RoomDetail,
    slots: TimeSlot[]
}