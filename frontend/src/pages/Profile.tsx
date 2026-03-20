import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  apiSlice,
  useChangePasswordMutation,
  useGetMeQuery,
  useGetMyBookingsQuery,
} from '../store/apiSlice';
import { clearAuth } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';

function formatName(p: { lastName: string; firstName: string; patronymic?: string | null }) {
  return [p.lastName, p.firstName, p.patronymic].filter(Boolean).join(' ');
}

export default function Profile() {
  const { isDemo } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: isDemo });
  const { data: myBookings = [], isLoading: bookLoading } = useGetMyBookingsQuery(undefined, { skip: isDemo });
  const [changePassword, { isLoading: pwdLoading }] = useChangePasswordMutation();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdOk(false);
    if (newPassword !== confirmPassword) {
      setPwdError('Новый пароль и подтверждение не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('Новый пароль не менее 8 символов');
      return;
    }
    try {
      await changePassword({ oldPassword, newPassword, confirmPassword }).unwrap();
      setPwdOk(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      dispatch(apiSlice.util.resetApiState());
      dispatch(clearAuth());
      navigate('/login');
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Не удалось сменить пароль');
    }
  };

  if (isDemo) {
    return (
      <div className="w-full">
        <h1 className="page-title">Профиль</h1>
        <div className="card p-8 text-ink-secondary">
          В демо-режиме профиль недоступен. Войдите под учётной записью из seed-скрипта
        </div>
      </div>
    );
  }

  if (meLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  if (!me) {
    return <p className="text-ink-tertiary">Не удалось загрузить профиль</p>;
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="page-title">Профиль</h1>
        <p className="page-subtitle">Данные учётной записи</p>
      </div>

      <div className="card p-6 sm:p-8 max-w-xl">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-tertiary">ФИО</dt>
            <dd className="font-medium text-ink-primary">{formatName(me)}</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary">Email</dt>
            <dd className="font-medium text-ink-primary">{me.email}</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary">Телефон</dt>
            <dd className="font-medium text-ink-primary">{me.phoneNumber}</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary">Дата рождения</dt>
            <dd className="font-medium text-ink-primary">{me.birth}</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary">Должность</dt>
            <dd className="font-medium text-ink-primary">{me.position}</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary">Роль</dt>
            <dd className="font-medium text-ink-primary">{me.role}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6 sm:p-8 max-w-xl">
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Смена пароля</h2>
        <p className="text-sm text-ink-tertiary mb-4">
          После смены пароля все сессии сбрасываются — войдите снова
        </p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwdError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pwdError}</div>
          )}
          {pwdOk && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Пароль изменён, перенаправляем на вход
            </div>
          )}
          <div>
            <label className="input-label">Текущий пароль</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              minLength={8}
              className="w-full"
            />
          </div>
          <div>
            <label className="input-label">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full"
            />
          </div>
          <div>
            <label className="input-label">Подтверждение нового пароля</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full"
            />
          </div>
          <button type="submit" disabled={pwdLoading} className="btn-primary px-5 py-2.5">
            {pwdLoading ? 'Сохранение...' : 'Сменить пароль'}
          </button>
        </form>
      </div>

      <div className="card p-5 max-w-md border-primary-100 bg-primary-50/30">
        <h2 className="text-sm font-semibold text-ink-primary mb-2">Мои бронирования</h2>
        <p className="text-xs text-ink-tertiary mb-3">
          Только переговорки, которые вы забронировали как организатор ({bookLoading ? '…' : myBookings.length})
        </p>
        {bookLoading ? (
          <p className="text-sm text-ink-muted">Загрузка...</p>
        ) : myBookings.length === 0 ? (
          <p className="text-sm text-ink-muted">Пока нет</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
            {myBookings.slice(0, 8).map((b) => (
              <li key={b.id}>
                <Link to={`/booking/${b.id}`} className="text-primary-600 hover:underline font-medium line-clamp-1">
                  {b.title}
                </Link>
                <span className="text-ink-tertiary block text-xs">
                  {b.date} {b.start_time} – {b.end_time}
                </span>
              </li>
            ))}
          </ul>
        )}
        {myBookings.length > 8 && (
          <Link to="/invite" className="text-xs text-primary-600 hover:underline mt-2 inline-block">
            Все бронирования в разделе «Пригласить»
          </Link>
        )}
      </div>
    </div>
  );
}
