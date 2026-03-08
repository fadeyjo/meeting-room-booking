import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyMeetings } from '../api/bookings';

export default function Meetings() {
  const { accessToken } = useAuth();
  const [meetings, setMeetings] = useState<Awaited<ReturnType<typeof getMyMeetings>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMeetings(accessToken).then(setMeetings).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <p className="text-slate-500">Загрузка...</p>;

  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Мои встречи на 2 недели</h1>
      {meetings.length === 0 ? (
        <p className="text-slate-500">Пока нет встреч</p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link
                to={`/booking/${m.id}`}
                className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition"
              >
                <span className="font-medium text-slate-800">{m.title}</span>
                <span className="text-slate-500 text-sm ml-2">{m.date} {m.start_time} – {m.end_time}</span>
                {m.description && <p className="text-slate-500 text-sm mt-1">{m.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
