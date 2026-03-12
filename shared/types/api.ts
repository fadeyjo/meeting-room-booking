export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  position: string;
  role?: string;
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

export interface PersonBrief {
  id: number;
  firstName: string;
  lastName: string;
  patronymic?: string | null;
}

export interface BookingDetail extends Booking {
  room?: Room;
  creator?: PersonBrief;
  speakers?: User[] | PersonBrief[];
  listeners?: User[] | PersonBrief[];
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
