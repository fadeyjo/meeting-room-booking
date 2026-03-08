import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyInvitations } from '../api/invitations';
import { acceptInvitation, declineInvitation } from '../api/invitations';

export default function Invitations() {
  const { accessToken } = useAuth();
  const [list, setList] = useState<Awaited<ReturnType<typeof getMyInvitations>>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => getMyInvitations(accessToken).then(setList);

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

  if (loading) return <p className="text-slate-500">Загрузка...</p>;

  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Приглашения</h1>
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
                  {inv.status === 'ожидает' && (
                    <>
                      <button type="button" onClick={() => handleAccept(inv.id)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Принять</button>
                      <button type="button" onClick={() => handleDecline(inv.id)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">Отклонить</button>
                    </>
                  )}
                  {inv.status === 'принято' && <span className="text-green-600 text-sm font-medium">Принято</span>}
                  {inv.status === 'отклонено' && <span className="text-slate-500 text-sm">Отклонено</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
