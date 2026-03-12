import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-800'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Layout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Переговорные
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Вход
            </Link>
          )}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Выйти
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex max-w-5xl w-full mx-auto gap-6 px-4 py-6">
        {isAuthenticated && (
          <aside className="w-48 shrink-0">
            <nav className="sticky top-6 flex flex-col gap-0.5">
              <NavLink to="/">Главная</NavLink>
              <NavLink to="/meetings">Мои встречи</NavLink>
              <NavLink to="/book/by-date">Бронировать по дате</NavLink>
              <NavLink to="/book/by-room">Бронировать по комнате</NavLink>
              <NavLink to="/invite">Пригласить на встречу</NavLink>
              <NavLink to="/invitations">Приглашения</NavLink>
              {isAdmin && <NavLink to="/admin">Админ</NavLink>}
            </nav>
          </aside>
        )}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
