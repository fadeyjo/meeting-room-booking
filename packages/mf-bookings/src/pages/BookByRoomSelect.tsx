import { Link } from 'react-router-dom';
import { useAuth } from '@mrb/store';
import { useGetRoomsQuery } from '@mrb/store';

export default function BookByRoomSelect() {
  const { isDemo } = useAuth();
  const { data: rooms = [], isLoading: loading } = useGetRoomsQuery({ is_active: true }, { skip: isDemo });

  if (isDemo) {
    return (
      <div className="w-full">
        <Link to="/book" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
        <div className="card p-8 text-ink-secondary">
          В демо-режиме список переговорок недоступен. Войдите под учётной записью из seed-скрипта
        </div>
      </div>
    );
  }

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
