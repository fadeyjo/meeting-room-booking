import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-primary-600 hover:text-primary-700">
            Переговорные
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                    Админ
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Вход
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col p-4 max-w-4xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
