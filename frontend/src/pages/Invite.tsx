import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyBookings } from '../api/bookings';

export default function Invite() {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof getMyBookings>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBookings(accessToken).then(setBookings).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <p className="text-slate-500">Загрузка...</p>;

  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Пригласить на встречу</h1>
      <p className="text-slate-600 text-sm mb-4">Выбери бронирование, на которое хочешь пригласить коллег:</p>
      {bookings.length === 0 ? (
        <p className="text-slate-500">У тебя пока нет бронирований. Сначала <Link to="/book" className="text-primary-600">забронируй переговорку</Link>.</p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                to={`/invite/${b.id}`}
                className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition"
              >
                <span className="font-medium text-slate-800">{b.title}</span>
                <span className="text-slate-500 text-sm ml-2">{b.date} {b.start_time} – {b.end_time}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
