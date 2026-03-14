import { Link } from 'react-router-dom';

export default function Book() {
  return (
    <div className="w-full">
      <h1 className="page-title">Забронировать переговорку</h1>
      <p className="page-subtitle mb-8">Выберите способ бронирования</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          to="/book/by-date"
          className="card-hover block p-6 text-left"
        >
          <h2 className="text-lg font-semibold text-ink-primary mb-1.5">По дате</h2>
          <p className="text-sm text-ink-tertiary">Выбери дату — покажем свободные комнаты и слоты</p>
        </Link>
        <Link
          to="/book/by-room"
          className="card-hover block p-6 text-left"
        >
          <h2 className="text-lg font-semibold text-ink-primary mb-1.5">Конкретная переговорка</h2>
          <p className="text-sm text-ink-tertiary">Выбери комнату и посмотри свободные даты</p>
        </Link>
      </div>
    </div>
  );
}
