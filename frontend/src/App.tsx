import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import {
  Admin,
  Book,
  BookByDate,
  BookByRoom,
  BookByRoomSelect,
  BookingDetail,
  Home,
  Invitations,
  Invite,
  InviteBooking,
  Login,
  Meetings,
  Profile,
} from './pages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="admin" element={<ProtectedRoute><AdminOnly><Admin /></AdminOnly></ProtectedRoute>} />
        <Route path="book" element={<ProtectedRoute><Book /></ProtectedRoute>} />
        <Route path="book/by-date" element={<ProtectedRoute><BookByDate /></ProtectedRoute>} />
        <Route path="book/by-room" element={<ProtectedRoute><BookByRoomSelect /></ProtectedRoute>} />
        <Route path="book/by-room/:roomId" element={<ProtectedRoute><BookByRoom /></ProtectedRoute>} />
        <Route path="invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
        <Route path="invite/:bookingId" element={<ProtectedRoute><InviteBooking /></ProtectedRoute>} />
        <Route path="meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
        <Route path="invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="booking/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
