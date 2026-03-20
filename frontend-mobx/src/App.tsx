import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from './store/context';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';

const Shell = observer(function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (store.isAuthenticated) {
      void store.loadProfile();
      void store.loadMyBookings();
    }
  }, [store, store.isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white/90 px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-bold text-primary-600">Переговорные · MobX</Link>
        <div className="flex items-center gap-3 text-sm">
          {store.isAuthenticated && store.profile && (
            <span className="text-ink-secondary hidden sm:inline" title="Кэш профиля + мои брони">
              {store.profile.lastName} {store.profile.firstName.charAt(0)}. · броней: {store.myBookings.length}
            </span>
          )}
          {store.isAuthenticated ? (
            <>
              <Link to="/profile" className="text-sm text-primary-600 hover:underline">Профиль</Link>
              <button type="button" className="btn-ghost text-sm" onClick={() => { void store.logout(); navigate('/login'); }}>
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2">Вход</Link>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
});

function Protected({ children }: { children: ReactNode }) {
  const store = useStore();
  if (!store.ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }
  if (!store.isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const store = useStore();
  if (!store.ready) return null;
  if (store.isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
