/** Модели по OpenAPI для фронта */

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  position: string;
  role?: string;
  /** дата увольнения; если задана — сотрудника нигде нельзя добавлять (в приглашения и т.п.) */
  firedAt?: string | null;
}

export interface CreateUserDto {
  email: string;
  phoneNumber: string;
  birth: string;
  lastName: string;
  firstName: string;
  patronymic?: string;
  position: string;
  password: string;
  roleName: 'User' | 'Admin';
}

/** частичное обновление сотрудника (только админ); все поля опциональны */
export interface UpdateUserDto {
  email?: string;
  phoneNumber?: string;
  birth?: string;
  lastName?: string;
  firstName?: string;
  patronymic?: string;
  position?: string;
  password?: string;
  roleName?: 'User' | 'Admin';
  firedAt?: string | null;
}

export interface Room {
  id: number;
  name: string;
  floor: number;
  capacity: number;
  has_projector: boolean;
  has_tv: boolean;
  has_whiteboard: boolean;
  is_active: boolean;
  description?: string;
}

export interface Booking {
  id: number;
  room_id: number;
  creator_id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: string;
  created_at?: string;
}

export interface BookingDetail extends Booking {
  room: Room;
  speakers: User[];
  listeners: User[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface RoomWithSlots {
  room: Room;
  slots: TimeSlot[];
}

export interface Invitation {
  id: number;
  booking_id: number;
  user_id: number;
  role: 'спикер' | 'слушатель';
  message?: string;
  status: 'ожидает' | 'принято' | 'отклонено';
  created_at?: string;
}

export interface InvitationWithBooking {
  id: number;
  booking: Booking;
  role: 'спикер' | 'слушатель';
  message?: string;
  status: 'ожидает' | 'принято' | 'отклонено';
}
