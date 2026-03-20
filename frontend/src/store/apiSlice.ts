import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Booking,
  BookingDetail,
  ChangePasswordDto,
  CreateUserDto,
  Invitation,
  InvitationWithBooking,
  LoginDto,
  Room,
  RoomWithSlots,
  SlotsByRoomResponse,
  TokensDto,
  UpdateUserDto,
  User,
  UserProfile,
} from '@shared/types';
import type { InvitationRequestItem } from '@shared/types/invitations';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? '',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'MyBookings', 'MyMeetings', 'Rooms', 'Room', 'BookingDetail', 'Invitations', 'InvitationRequests', 'UsersAdmin', 'RoomsByDate'],
  endpoints: (build) => ({
    login: build.mutation<TokensDto, LoginDto>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
    }),
    refresh: build.mutation<TokensDto, { refreshToken: string }>({
      query: (body) => ({ url: '/api/auth/refresh', method: 'POST', body }),
    }),
    logout: build.mutation<{ personId: number }, { refreshToken: string }>({
      query: (body) => ({ url: '/api/auth/logout', method: 'POST', body }),
    }),
    getMe: build.query<UserProfile, void>({
      query: () => '/api/auth/me',
      providesTags: ['User'],
    }),
    changePassword: build.mutation<void, ChangePasswordDto>({
      query: (body) => ({ url: '/api/auth/me/change-password', method: 'POST', body }),
    }),
    getMyBookings: build.query<Booking[], void>({
      query: () => '/api/bookings/my',
      providesTags: [{ type: 'MyBookings', id: 'LIST' }],
    }),
    getMyMeetings: build.query<Booking[], void>({
      query: () => '/api/bookings/my-meetings',
      providesTags: [{ type: 'MyMeetings', id: 'LIST' }],
    }),
    getBooking: build.query<BookingDetail, number>({
      query: (id) => `/api/bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'BookingDetail', id }],
    }),
    createBooking: build.mutation<
      Booking,
      { room_id: number; title: string; description: string; date: string; start_time: string; end_time: string }
    >({
      query: (body) => ({ url: '/api/bookings', method: 'POST', body }),
      invalidatesTags: [{ type: 'MyBookings', id: 'LIST' }, { type: 'MyMeetings', id: 'LIST' }, 'RoomsByDate'],
    }),
    cancelBooking: build.mutation<void, number>({
      query: (id) => ({ url: `/api/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'MyBookings', id: 'LIST' },
        { type: 'MyMeetings', id: 'LIST' },
        { type: 'BookingDetail', id },
      ],
    }),
    getSlotsByRoom: build.query<SlotsByRoomResponse, { roomId: number; date: string }>({
      query: ({ roomId, date }) => `/api/bookings/room/${roomId}/slots?date=${encodeURIComponent(date)}`,
    }),
    getRoomsByDate: build.query<RoomWithSlots[], string>({
      query: (date) => `/api/bookings/by-date?date=${encodeURIComponent(date)}`,
      providesTags: (_r, _e, date) => [{ type: 'RoomsByDate', id: date }],
    }),
    getRooms: build.query<Room[], { floor?: number; is_active?: boolean } | void>({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.floor != null) q.set('floor', String(params.floor));
        if (params?.is_active != null) q.set('is_active', String(params.is_active));
        const s = q.toString();
        return `/api/rooms${s ? `?${s}` : ''}`;
      },
      providesTags: ['Rooms'],
    }),
    getRoom: build.query<Room, number>({
      query: (id) => `/api/rooms/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Room', id }],
    }),
    getUsers: build.query<User[], void>({
      query: () => '/api/auth/users',
      providesTags: ['UsersAdmin'],
    }),
    searchUsers: build.query<User[], string>({
      query: (q) => `/api/auth/users/search?q=${encodeURIComponent(q)}`,
    }),
    createUser: build.mutation<User, CreateUserDto>({
      query: (body) => ({ url: '/api/auth/users', method: 'POST', body }),
      invalidatesTags: ['UsersAdmin'],
    }),
    updateUser: build.mutation<User, { id: number; body: UpdateUserDto }>({
      query: ({ id, body }) => ({ url: `/api/auth/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['UsersAdmin', 'User'],
    }),
    createInvitation: build.mutation<
      Invitation,
      { booking_id: number; user_id: number; role: 'спикер' | 'слушатель'; message?: string }
    >({
      query: (body) => ({ url: '/api/invitations', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'BookingDetail', id: arg.booking_id }, 'Invitations'],
    }),
    getMyInvitations: build.query<InvitationWithBooking[], string | void>({
      query: (status) => {
        const q = status ? `?status=${encodeURIComponent(status)}` : '';
        return `/api/invitations/my${q}`;
      },
      providesTags: ['Invitations'],
    }),
    getInvitationsByBooking: build.query<Invitation[], number>({
      query: (bookingId) => `/api/invitations/booking/${bookingId}`,
      providesTags: (_r, _e, bookingId) => [{ type: 'BookingDetail', id: bookingId }],
    }),
    acceptInvitation: build.mutation<void, number>({
      query: (id) => ({ url: `/api/invitations/${id}/accept`, method: 'PATCH' }),
      invalidatesTags: ['Invitations', { type: 'MyMeetings', id: 'LIST' }],
    }),
    declineInvitation: build.mutation<void, number>({
      query: (id) => ({ url: `/api/invitations/${id}/decline`, method: 'PATCH' }),
      invalidatesTags: ['Invitations'],
    }),
    removeFromMeeting: build.mutation<void, number>({
      query: (id) => ({ url: `/api/invitations/${id}/remove`, method: 'PATCH' }),
      invalidatesTags: ['Invitations', { type: 'MyMeetings', id: 'LIST' }, 'BookingDetail'],
    }),
    updateInvitationRole: build.mutation<Invitation, { id: number; role: 'спикер' | 'слушатель' }>({
      query: ({ id, role }) => ({ url: `/api/invitations/${id}`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['Invitations', 'BookingDetail'],
    }),
    createInvitationRequest: build.mutation<
      InvitationRequestItem,
      { booking_id: number; user_id: number; role: 'спикер' | 'слушатель'; message?: string }
    >({
      query: (body) => ({ url: '/api/invitations/request', method: 'POST', body }),
      invalidatesTags: ['InvitationRequests', 'BookingDetail'],
    }),
    getIncomingRequests: build.query<InvitationRequestItem[], void>({
      query: () => '/api/invitations/requests/incoming',
      providesTags: ['InvitationRequests'],
    }),
    getRequestsByBooking: build.query<InvitationRequestItem[], number>({
      query: (bookingId) => `/api/invitations/requests/booking/${bookingId}`,
      providesTags: (_r, _e, id) => [{ type: 'BookingDetail', id }],
    }),
    approveInvitationRequest: build.mutation<void, number>({
      query: (id) => ({ url: `/api/invitations/requests/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: ['InvitationRequests', 'Invitations', { type: 'MyMeetings', id: 'LIST' }, 'BookingDetail'],
    }),
    rejectInvitationRequest: build.mutation<void, number>({
      query: (id) => ({ url: `/api/invitations/requests/${id}/reject`, method: 'PATCH' }),
      invalidatesTags: ['InvitationRequests', 'BookingDetail'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useGetMyBookingsQuery,
  useGetMyMeetingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useGetSlotsByRoomQuery,
  useGetRoomsByDateQuery,
  useGetRoomsQuery,
  useGetRoomQuery,
  useGetUsersQuery,
  useLazySearchUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useCreateInvitationMutation,
  useGetMyInvitationsQuery,
  useGetInvitationsByBookingQuery,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useRemoveFromMeetingMutation,
  useUpdateInvitationRoleMutation,
  useCreateInvitationRequestMutation,
  useGetIncomingRequestsQuery,
  useGetRequestsByBookingQuery,
  useApproveInvitationRequestMutation,
  useRejectInvitationRequestMutation,
} = apiSlice;
