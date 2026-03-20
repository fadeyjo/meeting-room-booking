import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetMyMeetingsQuery } from '../store/apiSlice';

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

export default function Meetings() {
  const { isDemo } = useAuth();
  const { data: meetings = [], isLoading: loading } = useGetMyMeetingsQuery(undefined, { skip: isDemo });
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const t = today();
    const up = meetings.filter((m) => m.date >= t);
    const pa = meetings.filter((m) => m.date < t);
    up.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : (a.start_time || '').localeCompare(b.start_time || '')));
    pa.sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : (b.start_time || '').localeCompare(a.start_time || '')));
    return { upcoming: up, past: pa };
  }, [meetings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка встреч...</p>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="w-full">
        <h1 className="page-title">Мои встречи на 2 недели</h1>
        <p className="page-subtitle mb-8">Список ближайших бронирований</p>
        <div className="card p-12 text-center">
          <p className="text-ink-tertiary">Пока нет встреч</p>
          <Link to="/book" className="btn-primary mt-4 inline-flex px-5 py-2.5">Забронировать</Link>
        </div>
      </div>
    );
  }

  const MeetingCard = ({ m }: { m: (typeof meetings)[0] }) => (
    <Link
      to={`/booking/${m.id}`}
      className="card-hover block p-5"
    >
      <span className="font-semibold text-ink-primary">{m.title}</span>
      <span className="text-ink-tertiary text-sm ml-2">{m.date} {m.start_time} – {m.end_time}</span>
      {m.description && <p className="text-ink-tertiary text-sm mt-1.5 line-clamp-2">{m.description}</p>}
    </Link>
  );

  return (
    <div className="w-full">
      <div className="h-1 w-16 rounded-full bg-primary-400/60 mb-5" />
      <h1 className="page-title">Мои встречи на 2 недели</h1>
      <p className="page-subtitle mb-8">Предстоящие и прошедшие встречи</p>

      <CollapsibleSection
        title="Предстоящие встречи"
        count={upcoming.length}
        open={upcomingOpen}
        onToggle={() => setUpcomingOpen((o) => !o)}
      >
        {upcoming.length === 0 ? (
          <p className="text-ink-muted text-sm py-2">Нет предстоящих встреч</p>
        ) : (
          upcoming.map((m) => (
            <MeetingCard key={m.id} m={m} />
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
          <p className="text-ink-muted text-sm py-2">Нет прошедших встреч</p>
        ) : (
          past.map((m) => (
            <MeetingCard key={m.id} m={m} />
          ))
        )}
      </CollapsibleSection>
    </div>
  );
}
