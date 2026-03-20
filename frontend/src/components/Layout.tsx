import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetMeQuery, useGetMyBookingsQuery } from '../store/apiSlice';

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/meetings', label: 'Мои встречи' },
  { to: '/book/by-date', label: 'По дате' },
  { to: '/book/by-room', label: 'По комнате' },
  { to: '/invite', label: 'Пригласить' },
  { to: '/invitations', label: 'Приглашения' },
  { to: '/profile', label: 'Профиль' },
];

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-primary-600 text-white shadow-soft'
          : 'text-ink-secondary hover:bg-slate-100 hover:text-ink-primary'
      }`}
    >
      {children}
    </Link>
  );
}

function userShortName(p: { lastName: string; firstName: string }) {
  return `${p.lastName} ${p.firstName.charAt(0)}.`;
}

export default function Layout() {
  const { isAuthenticated, isAdmin, logout, isDemo } = useAuth();
  const navigate = useNavigate();
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated || isDemo });
  const { data: myBookings = [] } = useGetMyBookingsQuery(undefined, { skip: !isAuthenticated || isDemo });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-soft">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-primary-600 transition-colors hover:text-primary-700"
          >
            Переговорные
          </Link>
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="btn-primary px-5 py-2.5 text-sm"
              >
                Вход
              </Link>
            )}
            {isAuthenticated && (
              <>
                {isDemo ? (
                  <span className="text-sm text-ink-secondary hidden sm:inline">Демо</span>
                ) : me ? (
                  <span className="text-sm text-ink-secondary hidden sm:inline" title={`${me.lastName} ${me.firstName} · мои брони: ${myBookings.length}`}>
                    {userShortName(me)} · броней: {myBookings.length}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-ghost text-sm"
                >
                  Выйти
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-8 px-4 py-8 sm:px-6 mx-auto w-full max-w-5xl">
        {isAuthenticated && (
          <aside className="w-52 shrink-0">
            <nav className="sticky top-24 flex flex-col gap-1">
              {navItems.map(({ to, label }) => (
                <NavLink key={to} to={to}>{label}</NavLink>
              ))}
              {isAdmin && (
                <NavLink to="/admin">Админ</NavLink>
              )}
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
