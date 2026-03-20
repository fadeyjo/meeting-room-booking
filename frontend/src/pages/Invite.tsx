import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetMyBookingsQuery } from '../store/apiSlice';

const today = () => new Date().toISOString().slice(0, 10);

function CollapsibleSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/90 px-4 py-3.5 text-left shadow-soft border border-slate-200/80 hover:border-primary-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all duration-200"
      >
        <span className="font-semibold text-ink-primary">{title}</span>
        <span className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-ink-tertiary">
            {count}
          </span>
          <svg
            className={`h-5 w-5 text-ink-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3 space-y-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function Invite() {
  const { isDemo } = useAuth();
  const { data: bookings = [], isLoading: loading } = useGetMyBookingsQuery(undefined, { skip: isDemo });
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const t = today();
    const up = bookings.filter((b) => b.date >= t);
    const pa = bookings.filter((b) => b.date < t);
    up.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : (a.start_time || '').localeCompare(b.start_time || '')));
    pa.sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : (b.start_time || '').localeCompare(a.start_time || '')));
    return { upcoming: up, past: pa };
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="w-full">
        <h1 className="page-title">Пригласить на встречу</h1>
        <p className="page-subtitle mb-8">Выберите бронирование, на которое хотите пригласить коллег</p>
        <div className="card p-8 text-center">
          <p className="text-ink-tertiary">У вас пока нет бронирований.</p>
          <Link to="/book" className="btn-primary mt-4 inline-flex px-5 py-2.5">Забронировать переговорку</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="page-title">Пригласить на встречу</h1>
      <p className="page-subtitle mb-8">Выберите бронирование (только предстоящие). На прошедшие встречи приглашать нельзя</p>

      <CollapsibleSection
        title="Предстоящие встречи"
        count={upcoming.length}
        open={upcomingOpen}
        onToggle={() => setUpcomingOpen((o) => !o)}
      >
        {upcoming.length === 0 ? (
          <p className="text-ink-muted text-sm py-2">Нет предстоящих бронирований</p>
        ) : (
          upcoming.map((b) => (
            <Link key={b.id} to={`/invite/${b.id}`} className="card-hover block p-5">
              <span className="font-semibold text-ink-primary">{b.title}</span>
              <span className="text-ink-tertiary text-sm ml-2">{b.date} {b.start_time} – {b.end_time}</span>
            </Link>
          ))
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Прошедшие встречи"
        count={past.length}
        open={pastOpen}
        onToggle={() => setPastOpen((o) => !o)}
      >
        {past.length === 0 ? (
          <p className="text-ink-muted text-sm py-2">Нет прошедших бронирований</p>
        ) : (
          past.map((b) => (
            <div key={b.id} className="block p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="font-semibold text-ink-primary">{b.title}</span>
              <span className="text-ink-tertiary text-sm ml-2">{b.date} {b.start_time} – {b.end_time}</span>
              <p className="text-amber-700 text-sm mt-2">Встреча уже прошла, приглашать нельзя</p>
            </div>
          ))
        )}
      </CollapsibleSection>
    </div>
  );
}
