import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  getIncomingRequests,
  approveInvitationRequest,
  rejectInvitationRequest,
} from '../api/invitations';
import { invitationStatusLabel } from '../utils/invitationStatus';

export default function Invitations() {
  const { accessToken } = useAuth();
  const [list, setList] = useState<Awaited<ReturnType<typeof getMyInvitations>>>([]);
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getIncomingRequests>>>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [invList, reqList] = await Promise.all([
      getMyInvitations(accessToken),
      getIncomingRequests(accessToken),
    ]);
    setList(invList);
    setRequests(reqList);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [accessToken]);

  const handleAccept = async (id: number) => {
    await acceptInvitation(id, accessToken);
    load();
  };

  const handleDecline = async (id: number) => {
    await declineInvitation(id, accessToken);
    load();
  };

  const handleApproveRequest = async (id: number) => {
    await approveInvitationRequest(id, accessToken);
    load();
  };

  const handleRejectRequest = async (id: number) => {
    await rejectInvitationRequest(id, accessToken);
    load();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="page-title">Приглашения</h1>
      <p className="page-subtitle mb-8">Входящие приглашения и запросы на добавление участников</p>

      {requests.length > 0 && (
        <section className="mb-10">
          <h2 className="section-title mb-3">Запросы на добавление участников</h2>
          <p className="text-sm text-ink-tertiary mb-4">Участники встречи просят добавить коллег. Подтвердите или отклоните</p>
          <ul className="space-y-4">
            {requests.map((r) => (
              <li key={r.id} className="card border-amber-200 bg-amber-50/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-primary">
                      <span className="text-amber-800">{r.requested_by_name}</span> просит добавить <span className="font-semibold">{r.guest_name}</span> на встречу
                    </p>
                    <Link to={`/booking/${r.booking_id}`} className="text-primary-600 text-sm font-medium hover:underline mt-1 inline-block">
                      Перейти к встрече
                    </Link>
                    <p className="text-ink-tertiary text-sm mt-1">Роль: {r.role}</p>
                    {r.message && <p className="text-ink-muted text-sm mt-0.5">{r.message}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => handleApproveRequest(r.id)} className="btn-primary px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700">
                      Подтвердить
                    </button>
                    <button type="button" onClick={() => handleRejectRequest(r.id)} className="btn-secondary px-4 py-2 text-sm">
                      Отклонить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="section-title mb-3">Входящие приглашения</h2>
      {list.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-ink-tertiary">Нет приглашений</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((inv) => (
            <li key={inv.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/booking/${inv.booking.id}`} className="font-semibold text-primary-600 hover:underline">
                    {inv.booking.title}
                  </Link>
                  <p className="text-ink-tertiary text-sm mt-0.5">{inv.booking.date} {inv.booking.start_time} – {inv.booking.end_time}</p>
                  {inv.message && <p className="text-ink-secondary text-sm mt-1">{inv.message}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inv.status.toLowerCase() === 'ожидает' && (
                    <>
                      <button type="button" onClick={() => handleAccept(inv.id)} className="btn-primary px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700">
                        Принять
                      </button>
                      <button type="button" onClick={() => handleDecline(inv.id)} className="btn-secondary px-4 py-2 text-sm">
                        Отклонить
                      </button>
                    </>
                  )}
                  {inv.status.toLowerCase() === 'принято' && <span className="badge-success">Принято</span>}
                  {(inv.status.toLowerCase() === 'отклонено' || String(inv.status) === 'Отменено (переполнение)') && (
                    <span className="badge-muted">{invitationStatusLabel(inv.status)}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
