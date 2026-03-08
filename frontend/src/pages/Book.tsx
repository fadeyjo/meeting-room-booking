import { Link } from 'react-router-dom';

export default function Book() {
  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Забронировать переговорку</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/book/by-date"
          className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md transition text-left"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-1">По дате</h2>
          <p className="text-slate-500 text-sm">Выбери дату — покажем свободные комнаты и слоты</p>
        </Link>
        <Link
          to="/book/by-room"
          className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md transition text-left"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Конкретная переговорка</h2>
          <p className="text-slate-500 text-sm">Выбери комнату и посмотри свободные даты</p>
        </Link>
      </div>
    </div>
  );
}
