import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBooking } from '../api/bookings';
import {
  getInvitationsByBooking,
  updateInvitationRole,
  getRequestsByBooking,
  createInvitationRequest,
} from '../api/invitations';
import { searchUsers } from '../api/users';
import type { User, Invitation } from '@shared/types';
import type { PersonBrief } from '@shared/types';
import type { InvitationRequestItem } from '@shared/types/invitations';

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
  const { accessToken, personId } = useAuth();
  const bid = Number(id);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getBooking>> | null>(null);
  const [invitations, setInvitations] = useState<Awaited<ReturnType<typeof getInvitationsByBooking>>>([]);
  const [requests, setRequests] = useState<InvitationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [requestRole, setRequestRole] = useState<'спикер' | 'слушатель'>('слушатель');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const loadData = () => {
    if (!bid) return Promise.resolve();
    return Promise.all([
      getBooking(bid, accessToken),
      getInvitationsByBooking(bid, accessToken),
      getRequestsByBooking(bid, accessToken),
    ]).then(([d, inv, req]) => {
      setDetail(d ?? null);
      setInvitations(inv);
      setRequests(req);
    });
  };

  useEffect(() => {
    if (!bid) return;
    loadData().finally(() => setLoading(false));
  }, [bid, accessToken]);

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

  const handleRoleChange = async (invId: number, role: 'спикер' | 'слушатель') => {
    await updateInvitationRole(invId, role, accessToken);
    setInvitations((prev) => prev.map((i) => (i.id === invId ? { ...i, role } : i)));
    loadData();
  };

  const handleSubmitRequest = async () => {
    if (!selectedUser || !bid) return;
    setRequestError('');
    setRequestSubmitting(true);
    try {
      await createInvitationRequest(accessToken, {
        booking_id: bid,
        user_id: selectedUser.id,
        role: requestRole,
        message: requestMessage || undefined,
      });
      setSelectedUser(null);
      setRequestMessage('');
      setSearch('');
      loadData();
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : 'Ошибка отправки запроса');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (loading || !detail) return <p className="text-slate-500">Загрузка...</p>;

  const speakers = detail.speakers ?? [];
  const listeners = detail.listeners ?? [];
  const isOrganizer = detail.creator_id !== undefined && personId !== null && detail.creator_id === personId;
  const isParticipant =
    personId != null && (speakers.some((s) => s.id === personId) || listeners.some((l) => l.id === personId));

  const roomLabel = detail.room
    ? `${detail.room.name} (#${detail.room.id})`
    : `Комната #${detail.room_id}`;

  return (
    <div className="w-full py-6 flex gap-6 flex-col lg:flex-row">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="text-primary-600 text-sm font-medium hover:underline">← В главное меню</Link>
          <span className="text-slate-300">|</span>
          <Link to="/meetings" className="text-slate-600 text-sm font-medium hover:underline">К списку встреч</Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{detail.title}</h1>
        <p className="text-slate-700 text-sm mb-1">
          <span className="font-medium">Комната:</span> {roomLabel}
        </p>
        <p className="text-slate-600 text-sm mb-4">{detail.date} {detail.start_time} – {detail.end_time}</p>
        {detail.description && <p className="text-slate-600 mb-6">{detail.description}</p>}

        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Организатор</h2>
          {detail.creator ? (
            <p className="text-slate-800">{userName(detail.creator)}</p>
          ) : (
            <p className="text-slate-500 text-sm">—</p>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Спикеры</h2>
          {speakers.length === 0 ? (
            <p className="text-slate-500 text-sm">Нет спикеров</p>
          ) : (
            <ul className="space-y-1">
              {speakers.map((u) => (
                <li key={u.id} className="text-slate-800">{userName(u)}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Слушатели</h2>
          {listeners.length === 0 ? (
            <p className="text-slate-500 text-sm">Нет слушателей</p>
          ) : (
            <ul className="space-y-1">
              {listeners.map((u) => (
                <li key={u.id} className="text-slate-800">{userName(u)}</li>
              ))}
            </ul>
          )}
        </section>

        {invitations.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {isOrganizer ? 'Приглашённые (роль можно изменить)' : 'Приглашённые'}
            </h2>
            <ul className="space-y-2">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-800 font-medium">{invGuestName(inv)}</span>
                  {isOrganizer ? (
                    <select
                      value={(inv.role || '').toLowerCase()}
                      onChange={(e) => handleRoleChange(inv.id, e.target.value as 'спикер' | 'слушатель')}
                      className="text-sm rounded border border-slate-200 px-2 py-1"
                    >
                      <option value="спикер">Спикер</option>
                      <option value="слушатель">Слушатель</option>
                    </select>
                  ) : (
                    <span className="text-slate-600 text-sm">— {(inv.role || '').toLowerCase() === 'спикер' ? 'Спикер' : 'Слушатель'}</span>
                  )}
                  <span className="text-slate-500 text-sm">{inv.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {isParticipant && (
        <aside className="w-full lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-6 space-y-6">
            <section className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Запрос на приглашение</h2>
              <p className="text-slate-500 text-xs mb-3">Запросите добавление коллеги на встречу. Организатор подтвердит или отклонит.</p>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Поиск сотрудника</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ФИО"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
                {searchResults.length > 0 && (
                  <ul className="border border-slate-200 rounded-lg bg-white shadow-lg divide-y divide-slate-100 max-h-40 overflow-auto">
                    {searchResults
                      .filter((u) => u.id !== personId && !invitations.some((inv) => inv.user_id === u.id) && !requests.some((r) => r.guest_id === u.id && r.status === 'pending'))
                      .map((u) => (
                        <li key={u.id} className="px-3 py-2 flex items-center justify-between gap-2">
                          <span className="text-sm truncate">{u.position} {u.lastName} {u.firstName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setSearch('');
                              setSearchResults([]);
                            }}
                            className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700 shrink-0"
                          >
                            Выбрать
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              {selectedUser && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <p className="text-sm font-medium text-slate-800">{selectedUser.position} {userName(selectedUser)}</p>
                  <select
                    value={requestRole}
                    onChange={(e) => setRequestRole(e.target.value as 'спикер' | 'слушатель')}
                    className="w-full text-sm rounded border border-slate-200 px-2 py-1"
                  >
                    <option value="спикер">Спикер</option>
                    <option value="слушатель">Слушатель</option>
                  </select>
                  <input
                    type="text"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Сообщение (необязательно)"
                    className="w-full px-2 py-1 rounded border border-slate-200 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitRequest}
                      disabled={requestSubmitting}
                      className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                    >
                      {requestSubmitting ? 'Отправка...' : 'Отправить запрос'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setRequestMessage(''); }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
              {requestError && <p className="mt-2 text-red-600 text-sm">{requestError}</p>}
            </section>

            {requests.length > 0 && (
              <section className="p-4 bg-white rounded-xl border border-slate-200">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Мои запросы на приглашение</h2>
                <ul className="space-y-2">
                  {requests.map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="font-medium text-slate-800">{r.guest_name}</span>
                      <span className="text-slate-500 ml-1">— {requestStatusLabel(r.status)}</span>
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
