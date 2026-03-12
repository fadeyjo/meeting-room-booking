import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBooking } from '../api/bookings';
import { getInvitationsByBooking, updateInvitationRole } from '../api/invitations';
import type { User, Invitation } from '@shared/types';
import type { PersonBrief } from '@shared/types';

function userName(u: User | PersonBrief) {
  return [u.lastName, u.firstName, u.patronymic].filter(Boolean).join(' ');
}

function invGuestName(inv: Invitation & { lastName?: string; firstName?: string; patronymic?: string | null }) {
  return [inv.lastName, inv.firstName, inv.patronymic].filter(Boolean).join(' ') || '—';
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, personId } = useAuth();
  const bid = Number(id);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getBooking>> | null>(null);
  const [invitations, setInvitations] = useState<Awaited<ReturnType<typeof getInvitationsByBooking>>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!bid) return Promise.resolve();
    return Promise.all([getBooking(bid, accessToken), getInvitationsByBooking(bid, accessToken)]).then(([d, inv]) => {
      setDetail(d ?? null);
      setInvitations(inv);
    });
  };

  useEffect(() => {
    if (!bid) return;
    loadData().finally(() => setLoading(false));
  }, [bid, accessToken]);

  const handleRoleChange = async (invId: number, role: 'спикер' | 'слушатель') => {
    await updateInvitationRole(invId, role, accessToken);
    setInvitations((prev) => prev.map((i) => (i.id === invId ? { ...i, role } : i)));
    loadData();
  };

  if (loading || !detail) return <p className="text-slate-500">Загрузка...</p>;

  const speakers = detail.speakers ?? [];
  const listeners = detail.listeners ?? [];

  const roomLabel = detail.room
    ? `${detail.room.name} (#${detail.room.id})`
    : `Комната #${detail.room_id}`;

  return (
    <div className="w-full py-6">
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
            {detail.creator_id !== undefined && personId !== null && detail.creator_id === personId
              ? 'Приглашённые (роль можно изменить)'
              : 'Приглашённые'}
          </h2>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-800 font-medium">{invGuestName(inv)}</span>
                {detail.creator_id !== undefined && personId !== null && detail.creator_id === personId ? (
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
  );
}
