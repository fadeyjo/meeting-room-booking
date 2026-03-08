import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRooms } from '../api/rooms';

export default function BookByRoomSelect() {
  const { accessToken } = useAuth();
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof getRooms>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms(accessToken, { is_active: true }).then(setRooms).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <p className="text-slate-500">Загрузка...</p>;

  return (
    <div className="w-full py-6">
      <Link to="/book" className="text-primary-600 text-sm font-medium mb-4 inline-block">← Назад</Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Выбери переговорку</h1>
      <ul className="space-y-2">
        {rooms.map((r) => (
          <li key={r.id}>
            <Link
              to={`/book/by-room/${r.id}`}
              className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition"
            >
              {r.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
