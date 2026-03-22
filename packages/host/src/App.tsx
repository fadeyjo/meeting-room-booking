import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@mrb/store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';

const BookingsHome = lazy(() => import('bookings/Home'));
const BookRoutes = lazy(() => import('bookings/BookRoutes'));
const MeetingsPage = lazy(() => import('meetings/Meetings'));
const InvitationsPage = lazy(() => import('meetings/Invitations'));
const InvitePage = lazy(() => import('meetings/Invite'));
const InviteBookingPage = lazy(() => import('meetings/InviteBooking'));
const BookingDetailPage = lazy(() => import('meetings/BookingDetail'));
const AdminPage = lazy(() => import('admin/Admin'));

function MfFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-9 w-9 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
      <p className="text-sm text-ink-tertiary">Загрузка модуля…</p>
    </div>
  );
}

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
        <Route path="login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route
          index
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <BookingsHome />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="book/*"
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <BookRoutes />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="meetings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <MeetingsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="invitations"
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <InvitationsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="invite"
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <InvitePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="invite/:bookingId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <InviteBookingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="booking/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<MfFallback />}>
                <BookingDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <Suspense fallback={<MfFallback />}>
                  <AdminPage />
                </Suspense>
              </AdminOnly>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
