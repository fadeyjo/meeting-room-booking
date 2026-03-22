import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@mrb/store';
import {
  useCancelBookingMutation,
  useCreateInvitationRequestMutation,
  useGetBookingQuery,
  useGetInvitationsByBookingQuery,
  useGetRequestsByBookingQuery,
  useLazySearchUsersQuery,
  useRemoveFromMeetingMutation,
  useUpdateInvitationRoleMutation,
} from '@mrb/store';
import { invitationStatusLabel } from '../utils/invitationStatus';
import type { User, Invitation } from '@shared/types';
import type { PersonBrief } from '@shared/types';

function userName(u: User | PersonBrief) {
  return [u.lastName, u.firstName, u.patronymic].filter(Boolean).join(' ');
}

function invGuestName(inv: Invitation & { lastName?: string; firstName?: string; patronymic?: string | null }) {
  return [inv.lastName, inv.firstName, inv.patronymic].filter(Boolean).join(' ') || '—';
}

function requestStatusLabel(status: string) {
  if (status === 'pending') return 'Ожидает подтверждения от организатора';
  if (status === 'approved') return 'Организатор подтвердил приглашение';
  return 'Организатор отклонил запрос';
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { personId, isDemo } = useAuth();
  const bid = Number(id);
  const { data: detail, isLoading: loadingBooking, refetch: refetchBooking } = useGetBookingQuery(bid, {
    skip: !bid || isDemo,
  });
  const { data: invitations = [], refetch: refetchInv } = useGetInvitationsByBookingQuery(bid, {
    skip: !bid || isDemo,
  });
  const { data: requests = [], refetch: refetchReq } = useGetRequestsByBookingQuery(bid, {
    skip: !bid || isDemo,
  });
  const [triggerSearch] = useLazySearchUsersQuery();
  const [updateRoleMut] = useUpdateInvitationRoleMutation();
  const [removeMut] = useRemoveFromMeetingMutation();
  const [cancelMut] = useCancelBookingMutation();
  const [createReqMut] = useCreateInvitationRequestMutation();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [requestRole, setRequestRole] = useState<'спикер' | 'слушатель'>('слушатель');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const refetchAll = () => {
    void refetchBooking();
    void refetchInv();
    void refetchReq();
  };

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      void triggerSearch(search)
        .unwrap()
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [search, triggerSearch]);

  const handleRoleChange = async (invId: number, role: 'спикер' | 'слушатель') => {
    await updateRoleMut({ id: invId, role }).unwrap();
    refetchAll();
  };

  const handleRemoveFromMeeting = async (invId: number) => {
    setRemovingId(invId);
    try {
      await removeMut(invId).unwrap();
      refetchAll();
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Отменить бронирование? Это нельзя откатить')) return;
    setCancelling(true);
    try {
      await cancelMut(bid).unwrap();
      navigate('/meetings');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedUser || !bid) return;
    setRequestError('');
    setRequestSubmitting(true);
    try {
      await createReqMut({
        booking_id: bid,
        user_id: selectedUser.id,
        role: requestRole,
        message: requestMessage || undefined,
      }).unwrap();
      setSelectedUser(null);
      setRequestMessage('');
      setSearch('');
      refetchAll();
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : 'Не удалось отправить запрос');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (isDemo) {
    return (
      <div className="card p-8 text-ink-secondary">В демо-режиме карточка встречи недоступна</div>
    );
  }

  if (loadingBooking || !detail) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  const speakers = detail.speakers ?? [];
  const listeners = detail.listeners ?? [];
  const isOrganizer = detail.creator_id !== undefined && personId !== null && detail.creator_id === personId;
  const isParticipant =
    personId != null && (speakers.some((s) => s.id === personId) || listeners.some((l) => l.id === personId));

  const roomLabel = detail.room
    ? `${detail.room.name} (#${detail.room.id})`
    : `Комната #${detail.room_id}`;

  const capacity = detail.room?.capacity ?? 0;
  const totalParticipants = 1 + (speakers.length + listeners.length);
  const remaining = Math.max(0, capacity - totalParticipants);
  const isFull = capacity > 0 && remaining <= 0;

  return (
    <div className="w-full flex flex-col gap-8 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link to="/" className="text-primary-600 text-sm font-medium hover:underline">← В главное меню</Link>
          <span className="text-ink-muted">|</span>
          <Link to="/meetings" className="text-ink-tertiary text-sm font-medium hover:underline">К списку встреч</Link>
          {isOrganizer && (
            <>
              <span className="text-ink-muted">|</span>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50"
              >
                {cancelling ? 'Отмена…' : 'Отменить бронирование'}
              </button>
            </>
          )}
        </div>
        <h1 className="page-title mb-2">{detail.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center rounded-xl bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
            {detail.date} · {detail.start_time} – {detail.end_time}
          </span>
          <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-ink-secondary">
            {roomLabel}
          </span>
          {capacity > 0 && (
            <span className="text-sm text-ink-tertiary">
              Переговорка рассчитана на {capacity} чел.
              {remaining <= 0 ? ' · Достигнуто максимальное количество гостей' : ` · Осталось ${remaining} мест`}
            </span>
          )}
        </div>

        {detail.description && (
          <div className="mb-6 rounded-2xl border-l-4 border-primary-500 bg-gradient-to-br from-primary-50/60 to-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-2">Описание встречи</p>
            <p className="text-ink-secondary leading-relaxed whitespace-pre-wrap">{detail.description}</p>
          </div>
        )}

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="section-title mb-2">Организатор</h2>
            {detail.creator ? (
              <p className="text-ink-primary font-medium">{userName(detail.creator)}</p>
            ) : (
              <p className="text-ink-muted text-sm">—</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-2">Спикеры</h2>
            {speakers.length === 0 ? (
              <p className="text-ink-muted text-sm">Нет спикеров</p>
            ) : (
              <ul className="space-y-1">
                {speakers.map((u) => (
                  <li key={u.id} className="text-ink-primary">{userName(u)}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-2">Слушатели</h2>
            {listeners.length === 0 ? (
              <p className="text-ink-muted text-sm">Нет слушателей</p>
            ) : (
              <ul className="space-y-1">
                {listeners.map((u) => (
                  <li key={u.id} className="text-ink-primary">{userName(u)}</li>
                ))}
              </ul>
            )}
          </section>

          {invitations.length > 0 && (
            <section className="card p-5">
              <h2 className="section-title mb-2">
                {isOrganizer ? 'Приглашённые (роль можно изменить)' : 'Приглашённые'}
              </h2>
              <ul className="space-y-2">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-primary">{invGuestName(inv)}</span>
                    {isOrganizer ? (
                      <>
                        <select
                          value={(inv.role || '').toLowerCase()}
                          onChange={(e) => handleRoleChange(inv.id, e.target.value as 'спикер' | 'слушатель')}
                          className="text-sm max-w-[120px] py-1.5"
                        >
                          <option value="спикер">Спикер</option>
                          <option value="слушатель">Слушатель</option>
                        </select>
                        {(inv.status || '').toLowerCase() === 'принято' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFromMeeting(inv.id)}
                            disabled={removingId === inv.id}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            {removingId === inv.id ? '…' : 'Удалить со встречи'}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-ink-tertiary text-sm">— {(inv.role || '').toLowerCase() === 'спикер' ? 'Спикер' : 'Слушатель'}</span>
                    )}
                    <span className="text-ink-muted text-sm">{invitationStatusLabel(inv.status || '')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {isParticipant && (
        <aside className="w-full shrink-0 lg:w-80">
          <div className="lg:sticky lg:top-24 space-y-6">
            <section className="card p-5 bg-slate-50/50 border-slate-200">
              <h2 className="section-title mb-2">Запрос на приглашение</h2>
              {isFull ? (
                <p className="text-amber-700 text-sm font-medium">Переговорка заполнена, добавлять ещё нельзя</p>
              ) : (
                <>
              <p className="text-ink-muted text-xs mb-3">Запросите добавление коллеги на встречу. Организатор подтвердит или отклонит</p>
              <div className="space-y-2">
                <label className="input-label">Поиск сотрудника</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ФИО"
                  className="w-full text-sm"
                />
                {searchResults.length > 0 && (
                  <ul className="rounded-xl border border-slate-200 bg-white shadow-soft divide-y divide-slate-100 max-h-40 overflow-auto">
                    {searchResults
                      .filter((u) => u.id !== personId && u.id !== detail?.creator_id && !invitations.some((inv) => inv.user_id === u.id) && !requests.some((r) => r.guest_id === u.id && r.status === 'pending'))
                      .map((u) => {
                        const fullName = userName(u);
                        const fullNameWithPosition = fullName ? `${fullName} · ${u.position}` : u.position;
                        return (
                        <li
                          key={u.id}
                          className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50"
                          title={fullNameWithPosition}
                        >
                          <span className="text-sm truncate text-ink-secondary">{u.position} {u.lastName} {u.firstName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setSearch('');
                              setSearchResults([]);
                            }}
                            className="btn-primary text-xs px-2.5 py-1.5 shrink-0"
                          >
                            Выбрать
                          </button>
                        </li>
                        );
                      })}
                  </ul>
                )}
              </div>
              {selectedUser && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                  <p className="text-sm font-medium text-ink-primary">{selectedUser.position} {userName(selectedUser)}</p>
                  <select
                    value={requestRole}
                    onChange={(e) => setRequestRole(e.target.value as 'спикер' | 'слушатель')}
                    className="w-full text-sm py-2"
                  >
                    <option value="спикер">Спикер</option>
                    <option value="слушатель">Слушатель</option>
                  </select>
                  <input
                    type="text"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Сообщение (необязательно)"
                    className="w-full text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitRequest}
                      disabled={requestSubmitting}
                      className="btn-primary px-3 py-2 text-sm"
                    >
                      {requestSubmitting ? 'Отправка...' : 'Отправить запрос'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setRequestMessage(''); }}
                      className="btn-secondary px-3 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
              {requestError && <p className="mt-2 text-sm text-red-600">{requestError}</p>}
                </>
              )}
            </section>

            {requests.length > 0 && (
              <section className="card p-5">
                <h2 className="section-title mb-2">Мои запросы на приглашение</h2>
                <ul className="space-y-2">
                  {requests.map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="font-medium text-ink-primary">{r.guest_name}</span>
                      <span className="text-ink-muted ml-1">— {requestStatusLabel(r.status)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
