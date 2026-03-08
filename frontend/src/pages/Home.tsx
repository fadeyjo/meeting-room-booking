import { Link } from 'react-router-dom';

const cards = [
  { to: '/book', title: 'Забронировать переговорку', desc: 'Выбрать дату или конкретную комнату' },
  { to: '/invite', title: 'Пригласить на встречу', desc: 'Выбрать бронь и пригласить коллег' },
  { to: '/meetings', title: 'Мои встречи на 2 недели', desc: 'Список ближайших встреч' },
  { to: '/invitations', title: 'Приглашения', desc: 'Входящие приглашения в переговорки' },
];

export default function Home() {
  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Главная</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ to, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md transition text-left"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-1">{title}</h2>
            <p className="text-slate-500 text-sm">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
