import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBooking } from '../api/bookings';
import { searchUsers } from '../api/users';
import { createInvitation as postInvitation } from '../api/invitations';
import type { User } from '@shared/types';

type PendingInvite = { user: User; role: 'спикер' | 'слушатель'; message: string };

export default function InviteBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const id = Number(bookingId);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [bookingTitle, setBookingTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBooking(id, accessToken).then((b) => b && setBookingTitle(b.title));
  }, [id, accessToken]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(search, accessToken).then(setSearchResults);
    }, 200);
    return () => clearTimeout(t);
  }, [search, accessToken]);

  const addPending = (user: User, role: 'спикер' | 'слушатель') => {
    if (pending.some((p) => p.user.id === user.id)) return;
    setPending((prev) => [...prev, { user, role, message: '' }]);
    setSearch('');
    setSearchResults([]);
  };

  const removePending = (userId: number) => {
    setPending((prev) => prev.filter((p) => p.user.id !== userId));
  };

  const setPendingRole = (userId: number, role: 'спикер' | 'слушатель') => {
    setPending((prev) => prev.map((p) => (p.user.id === userId ? { ...p, role } : p)));
  };

  const setPendingMessage = (userId: number, message: string) => {
    setPending((prev) => prev.map((p) => (p.user.id === userId ? { ...p, message } : p)));
  };

  const handleSend = async () => {
    if (!id || pending.length === 0) return;
    setSubmitting(true);
    try {
      for (const p of pending) {
        await postInvitation(accessToken, { booking_id: id, user_id: p.user.id, role: p.role, message: p.message || undefined });
      }
      setSent(true);
      setTimeout(() => navigate('/'), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) return null;

  return (
    <div className="w-full py-6">
      <Link to="/invite" className="text-primary-600 text-sm font-medium mb-4 inline-block">← Назад</Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Приглашение на встречу</h1>
      <p className="text-slate-500 text-sm mb-6">Тема: {bookingTitle}</p>

      {sent ? (
        <p className="text-green-600 font-medium">Приглашения отправлены. Перенаправляем на главную...</p>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Поиск сотрудника (ФИО, должность)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Губин"
              className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-200"
            />
            {searchResults.length > 0 && (
              <ul className="mt-2 border border-slate-200 rounded-lg bg-white shadow-lg max-w-md divide-y divide-slate-100">
                {searchResults.map((u) => (
                  <li key={u.id} className="px-3 py-2 flex items-center justify-between">
                    <span>{u.position} {u.lastName} {u.firstName}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => addPending(u, 'спикер')} className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700">Спикер</button>
                      <button type="button" onClick={() => addPending(u, 'слушатель')} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">Слушатель</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="font-medium text-slate-800 mb-4">Кого приглашаем</h2>
              <ul className="space-y-4">
                {pending.map((p) => (
                  <li key={p.user.id} className="flex flex-wrap items-start gap-2">
                    <span className="font-medium">{p.user.position} {p.user.lastName} {p.user.firstName}</span>
                    <select value={p.role} onChange={(e) => setPendingRole(p.user.id, e.target.value as 'спикер' | 'слушатель')} className="text-sm rounded border border-slate-200 px-2 py-1">
                      <option value="спикер">спикер</option>
                      <option value="слушатель">слушатель</option>
                    </select>
                    <input type="text" value={p.message} onChange={(e) => setPendingMessage(p.user.id, e.target.value)} placeholder="Сообщение (необязательно)" className="flex-1 min-w-[120px] text-sm px-2 py-1 rounded border border-slate-200" />
                    <button type="button" onClick={() => removePending(p.user.id)} className="text-red-600 text-sm">Убрать</button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={handleSend} disabled={submitting} className="mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50">
                {submitting ? 'Отправка...' : 'Отправить приглашения'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
