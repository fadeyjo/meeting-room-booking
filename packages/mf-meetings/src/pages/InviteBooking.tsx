import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@mrb/store';
import {
  useCreateInvitationMutation,
  useGetBookingQuery,
  useGetInvitationsByBookingQuery,
  useLazySearchUsersQuery,
} from '@mrb/store';
import type { User } from '@shared/types';

type PendingInvite = { user: User; role: 'спикер' | 'слушатель'; message: string };

export default function InviteBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const id = Number(bookingId);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const { data: bookingDetail } = useGetBookingQuery(id, { skip: !id || isDemo });
  const { data: invitations = [] } = useGetInvitationsByBookingQuery(id, { skip: !id || isDemo });
  const [triggerSearch] = useLazySearchUsersQuery();
  const [createInvitationMu] = useCreateInvitationMutation();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const capacity = bookingDetail?.room?.capacity ?? 0;
  const speakers = bookingDetail?.speakers ?? [];
  const listeners = bookingDetail?.listeners ?? [];
  const totalParticipants = 1 + speakers.length + listeners.length;
  const remaining = Math.max(0, capacity - totalParticipants);
  const isFull = capacity > 0 && remaining <= 0;

  const isPast = useMemo(() => {
    if (!bookingDetail?.date || !bookingDetail?.end_time) return false;
    const end = new Date(bookingDetail.date + 'T' + bookingDetail.end_time);
    return !isNaN(end.getTime()) && end < new Date();
  }, [bookingDetail?.date, bookingDetail?.end_time]);

  const alreadyInMeetingIds = useMemo(() => {
    const ids = new Set<number>([
      ...(bookingDetail?.creator_id != null ? [bookingDetail.creator_id] : []),
      ...(speakers as { id: number }[]).map((s) => s.id),
      ...(listeners as { id: number }[]).map((l) => l.id),
      ...invitations.map((i) => i.user_id),
    ]);
    return ids;
  }, [bookingDetail?.creator_id, speakers, listeners, invitations]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      void triggerSearch(search)
        .unwrap()
        .then((list) => setSearchResults(list.filter((u) => !alreadyInMeetingIds.has(u.id))))
        .catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [search, triggerSearch, alreadyInMeetingIds]);

  const addPending = (user: User, role: 'спикер' | 'слушатель') => {
    if (alreadyInMeetingIds.has(user.id)) return;
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
    if (!id || pending.length === 0 || isFull) return;
    setSubmitting(true);
    try {
      for (const p of pending) {
        await createInvitationMu({
          booking_id: id,
          user_id: p.user.id,
          role: p.role,
          message: p.message || undefined,
        }).unwrap();
      }
      setSent(true);
      setTimeout(() => navigate('/'), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) return null;

  if (isDemo) {
    return (
      <div className="w-full">
        <Link to="/invite" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
        <div className="card p-8 text-ink-secondary">В демо-режиме приглашения недоступны</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link to="/invite" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
      <h1 className="page-title">Приглашение на встречу</h1>
      <p className={`page-subtitle ${capacity > 0 ? 'mb-2' : 'mb-8'}`}>Тема: {bookingDetail?.title ?? '…'}</p>
      {capacity > 0 && (
        <p className="text-sm text-ink-tertiary mb-8">
          Переговорка рассчитана на {capacity} чел.
          {isFull ? ' · Достигнуто максимальное количество гостей' : ` · Осталось ${remaining} мест`}
        </p>
      )}

      {sent ? (
        <div className="card p-8 text-center">
          <p className="text-emerald-600 font-medium">Приглашения отправлены, перенаправляем на главную...</p>
        </div>
      ) : isPast ? (
        <div className="card p-6">
          <p className="text-amber-700 font-medium">встреча уже прошла, приглашать нельзя.</p>
          <Link to="/invite" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">← К списку бронирований</Link>
        </div>
      ) : isFull ? (
        <div className="card p-6">
          <p className="text-amber-700 font-medium">Переговорка заполнена, добавлять ещё нельзя</p>
        </div>
      ) : (
        <>
          <div className="card p-6 mb-8">
            <label className="input-label">Поиск сотрудника (ФИО, должность)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ФИО"
              className="w-full max-w-md"
            />
            {searchResults.length > 0 && (
              <ul className="mt-3 rounded-xl border border-slate-200 bg-white shadow-soft max-w-md divide-y divide-slate-100 overflow-hidden">
                {searchResults.map((u) => {
                const fullName = [u.lastName, u.firstName, u.patronymic].filter(Boolean).join(' ');
                const fullNameWithPosition = fullName ? `${fullName} · ${u.position}` : u.position;
                return (
                  <li
                    key={u.id}
                    className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-slate-50"
                    title={fullNameWithPosition}
                  >
                    <span className="text-ink-secondary text-sm">{u.position} {u.lastName} {u.firstName}</span>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => addPending(u, 'спикер')} className="rounded-lg bg-primary-100 px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-200">
                        Спикер
                      </button>
                      <button type="button" onClick={() => addPending(u, 'слушатель')} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-slate-200">
                        Слушатель
                      </button>
                    </div>
                  </li>
                );
              })}
              </ul>
            )}
          </div>

          {pending.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="font-semibold text-ink-primary mb-4">Кого приглашаем</h2>
              <ul className="space-y-4">
                {pending.map((p) => (
                  <li key={p.user.id} className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-ink-primary">{p.user.position} {p.user.lastName} {p.user.firstName}</span>
                    <select value={p.role} onChange={(e) => setPendingRole(p.user.id, e.target.value as 'спикер' | 'слушатель')} className="text-sm max-w-[140px]">
                      <option value="спикер">Спикер</option>
                      <option value="слушатель">Слушатель</option>
                    </select>
                    <input type="text" value={p.message} onChange={(e) => setPendingMessage(p.user.id, e.target.value)} placeholder="Сообщение (необязательно)" className="flex-1 min-w-[140px] text-sm" />
                    <button type="button" onClick={() => removePending(p.user.id)} className="text-red-600 text-sm font-medium hover:underline">
                      Убрать
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={handleSend} disabled={submitting} className="btn-primary mt-5 px-5 py-2.5">
                {submitting ? 'Отправка...' : 'Отправить приглашения'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
