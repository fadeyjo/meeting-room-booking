import { Link } from 'react-router-dom';

const cards = [
  { to: '/book', title: 'Забронировать переговорку', desc: 'Выбрать дату или конкретную комнату', accent: true },
  { to: '/invite', title: 'Пригласить на встречу', desc: 'Выбрать бронь и пригласить коллег', accent: false },
  { to: '/meetings', title: 'Мои встречи на 2 недели', desc: 'Список ближайших встреч', accent: false },
  { to: '/invitations', title: 'Приглашения', desc: 'Входящие приглашения в переговорки', accent: false },
];

export default function Home() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="h-1 w-16 rounded-full bg-primary-400/60 mb-5" />
        <h1 className="page-title">Главная</h1>
        <p className="page-subtitle mt-1">Выберите действие для быстрого перехода</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map(({ to, title, desc, accent }) => (
          <Link
            key={to}
            to={to}
            className={`card-hover block p-6 text-left ${accent ? 'ring-1 ring-primary-100' : ''}`}
          >
            <h2 className="text-lg font-semibold text-ink-primary mb-1.5">{title}</h2>
            <p className="text-sm text-ink-tertiary">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
