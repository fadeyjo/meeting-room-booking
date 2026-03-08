import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBooking } from '../api/bookings';
import { getInvitationsByBooking } from '../api/invitations';
import { updateInvitationRole } from '../api/invitations';
import type { User } from '@shared/types';

function userName(u: User) {
  return [u.lastName, u.firstName, u.patronymic].filter(Boolean).join(' ');
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const bid = Number(id);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getBooking>> | null>(null);
  const [invitations, setInvitations] = useState<Awaited<ReturnType<typeof getInvitationsByBooking>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bid) return;
    Promise.all([getBooking(bid, accessToken), getInvitationsByBooking(bid, accessToken)]).then(([d, inv]) => {
      setDetail(d ?? null);
      setInvitations(inv);
    }).finally(() => setLoading(false));
  }, [bid, accessToken]);

  const handleRoleChange = async (invId: number, role: 'спикер' | 'слушатель') => {
    await updateInvitationRole(invId, role, accessToken);
    setInvitations((prev) => prev.map((i) => (i.id === invId ? { ...i, role } : i)));
  };

  if (loading || !detail) return <p className="text-slate-500">Загрузка...</p>;

  const speakers = detail.speakers ?? [];
  const listeners = detail.listeners ?? [];

  return (
    <div className="w-full py-6">
      <Link to="/meetings" className="text-primary-600 text-sm font-medium mb-4 inline-block">← К списку встреч</Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{detail.title}</h1>
      <p className="text-slate-500 text-sm mb-2">{detail.room?.name ?? `Комната #${detail.room_id}`}</p>
      <p className="text-slate-600 text-sm mb-4">{detail.date} {detail.start_time} – {detail.end_time}</p>
      {detail.description && <p className="text-slate-600 mb-6">{detail.description}</p>}

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Спикеры</h2>
        {speakers.length === 0 ? (
          <p className="text-slate-500 text-sm">Нет спикеров</p>
        ) : (
          <ul className="space-y-1">
            {speakers.map((u: User) => (
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
            {listeners.map((u: User) => (
              <li key={u.id} className="text-slate-800">{userName(u)}</li>
            ))}
          </ul>
        )}
      </section>

      {invitations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Приглашённые (роль можно изменить)</h2>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2">
                <span className="text-slate-800">ID {inv.user_id}</span>
                <select
                  value={inv.role}
                  onChange={(e) => handleRoleChange(inv.id, e.target.value as 'спикер' | 'слушатель')}
                  className="text-sm rounded border border-slate-200 px-2 py-1"
                >
                  <option value="спикер">спикер</option>
                  <option value="слушатель">слушатель</option>
                </select>
                <span className="text-slate-500 text-sm">{inv.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
