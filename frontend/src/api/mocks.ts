import type {
  User,
  Room,
  Booking,
  BookingDetail,
  Invitation,
  InvitationWithBooking,
  TimeSlot,
  RoomWithSlots,
} from '@shared/types';

const roomsList: Room[] = [
    {
      id: 1,
      name: 'Амурский Тигр (на 20 человек, 3 этаж)',
      floor: 3,
      capacity: 20,
      has_projector: true,
      has_tv: true,
      has_whiteboard: true,
      is_active: true,
      description: 'Большая переговорка',
    },
    {
      id: 2,
      name: 'Бизнес-Лемур (на 6 человек, 2 этаж)',
      floor: 2,
      capacity: 6,
      has_projector: false,
      has_tv: true,
      has_whiteboard: true,
      is_active: true,
    },
    {
      id: 3,
      name: 'Бюджетный Хомяк (на 4 человека, 1 этаж)',
      floor: 1,
      capacity: 4,
      has_projector: false,
      has_tv: false,
      has_whiteboard: true,
      is_active: true,
    },
  ];

const usersList: User[] = [
    { id: 1, email: 'admin@mail.ru', firstName: 'Админ', lastName: 'Системы', position: 'Администратор', role: 'Admin' },
    { id: 2, email: 'gubin@mail.ru', firstName: 'Егор', lastName: 'Губин', patronymic: 'И.', position: 'Программист', role: 'User' },
    { id: 3, email: 'valyavkin@mail.ru', firstName: 'Максим', lastName: 'Валявкин', position: 'Аналитик', role: 'User' },
    { id: 4, email: 'alekperov@mail.ru', firstName: 'Низами', lastName: 'Алекперов', position: 'Программист', role: 'User', firedAt: '2025-01-15T12:00:00.000Z' },
  ];

const bookingsList: Booking[] = [
    {
      id: 1,
      room_id: 1,
      creator_id: 1,
      title: 'Спринт-планнинг',
      description: 'Обсуждение задач на спринт',
      date: new Date().toISOString().slice(0, 10),
      start_time: '10:00',
      end_time: '11:30',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      room_id: 2,
      creator_id: 1,
      title: 'Демо продукта',
      description: 'Демонстрация фич стейкхолдерам',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      start_time: '14:00',
      end_time: '15:00',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    },
  ];

const slotsList: TimeSlot[] = [
    { start_time: '09:00', end_time: '10:00' },
    { start_time: '10:00', end_time: '11:00' },
    { start_time: '11:00', end_time: '12:00' },
    { start_time: '14:00', end_time: '15:00' },
  ];

export function bookingDetailMock(id: number): BookingDetail {
  const b = bookingsList.find((x) => x.id === id) ?? bookingsList[0];
  return {
    ...b,
    room: roomsList[0],
    speakers: [usersList[2], usersList[1]],
    listeners: [usersList[3]],
  };
}

const myInvitationsList: InvitationWithBooking[] = [
  {
    id: 1,
    booking: bookingsList[0],
      role: 'слушатель' as const,
      message: 'Присоединяйся',
      status: 'ожидает' as const,
    },
  ];

const invitationsByBookingList: Invitation[] = [
    { id: 1, booking_id: 1, user_id: 2, role: 'спикер' as const, message: '', status: 'принято' as const, created_at: new Date().toISOString() },
    { id: 2, booking_id: 1, user_id: 3, role: 'слушатель' as const, status: 'ожидает' as const, created_at: new Date().toISOString() },
  ];

export const mocks = {
  rooms: roomsList,
  users: usersList,
  bookings: bookingsList,
  bookingDetail: bookingDetailMock,
  slots: slotsList,
  byDate: (): RoomWithSlots[] => roomsList.map((room) => ({ room, slots: slotsList })),
  myInvitations: myInvitationsList,
  invitationsByBooking: invitationsByBookingList,
};
