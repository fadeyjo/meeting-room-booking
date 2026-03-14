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

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка переговорок...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link to="/book" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
      <h1 className="page-title">Выберите переговорку</h1>
      <p className="page-subtitle mb-8">Нажмите на комнату, чтобы увидеть свободные слоты</p>
      <ul className="space-y-3">
        {rooms.map((r) => (
          <li key={r.id}>
            <Link
              to={`/book/by-room/${r.id}`}
              className="card-hover block p-5 text-ink-primary font-medium"
            >
              {r.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
