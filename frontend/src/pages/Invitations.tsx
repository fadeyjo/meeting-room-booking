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

  if (loading) return <p className="text-slate-500">Загрузка...</p>;

  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Приглашения</h1>

      {requests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Запросы на добавление участников</h2>
          <p className="text-slate-500 text-sm mb-3">Участники встречи просят добавить коллег. Подтвердите или отклоните.</p>
          <ul className="space-y-4">
            {requests.map((r) => (
              <li key={r.id} className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-slate-800">
                      <span className="text-amber-800">{r.requested_by_name}</span> просит добавить <span className="font-semibold">{r.guest_name}</span> на встречу
                    </p>
                    <Link to={`/booking/${r.booking_id}`} className="text-primary-600 text-sm hover:underline mt-0.5 inline-block">
                      Перейти к встрече
                    </Link>
                    <p className="text-slate-600 text-sm mt-1">Роль: {r.role}</p>
                    {r.message && <p className="text-slate-500 text-sm mt-0.5">{r.message}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => handleApproveRequest(r.id)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Подтвердить</button>
                    <button type="button" onClick={() => handleRejectRequest(r.id)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">Отклонить</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="text-lg font-semibold text-slate-700 mb-3">Входящие приглашения</h2>
      {list.length === 0 ? (
        <p className="text-slate-500">Нет приглашений</p>
      ) : (
        <ul className="space-y-4">
          {list.map((inv) => (
            <li key={inv.id} className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/booking/${inv.booking.id}`} className="font-medium text-primary-600 hover:underline">
                    {inv.booking.title}
                  </Link>
                  <p className="text-slate-500 text-sm mt-0.5">{inv.booking.date} {inv.booking.start_time} – {inv.booking.end_time}</p>
                  {inv.message && <p className="text-slate-600 text-sm mt-1">{inv.message}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {inv.status.toLowerCase() === 'ожидает' && (
                    <>
                      <button type="button" onClick={() => handleAccept(inv.id)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Принять</button>
                      <button type="button" onClick={() => handleDecline(inv.id)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">Отклонить</button>
                    </>
                  )}
                  {inv.status.toLowerCase() === 'принято' && <span className="text-green-600 text-sm font-medium">Принято</span>}
                  {inv.status.toLowerCase() === 'отклонено' && <span className="text-slate-500 text-sm">Отклонено</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
