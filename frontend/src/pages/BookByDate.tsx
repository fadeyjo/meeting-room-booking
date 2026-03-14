import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoomsByDate, createBooking } from '../api/bookings';
import { isRangeOverlapping, isRangeWithinFree, timeToMinutes, getBookingDateLimits, getBookingDateOptions } from '../utils/slots';
import type { RoomWithSlots, TimeSlot } from '@shared/types';

export default function BookByDate() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { min: dateMin, max: dateMax } = useMemo(() => getBookingDateLimits(), []);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const dateOptions = useMemo(() => getBookingDateOptions(), []);
  const [data, setData] = useState<RoomWithSlots[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ roomId: number; roomName: string; capacity: number; start: string; end: string; free: TimeSlot[]; occupied: TimeSlot[] } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (date < dateMin || date > dateMax) setDate(dateMin);
  }, [date, dateMin, dateMax]);

  useEffect(() => {
    setLoading(true);
    getRoomsByDate(date, accessToken).then(setData).finally(() => setLoading(false));
  }, [date, accessToken]);

  const handleSelectRange = (roomId: number, roomName: string, capacity: number, start: string, end: string, free: TimeSlot[], occupied: TimeSlot[]) => {
    setSelected({ roomId, roomName, capacity, start, end, free, occupied });
    setTimeError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const startM = timeToMinutes(selected.start);
    const endM = timeToMinutes(selected.end);
    if (startM >= endM) {
      setTimeError('Конец должен быть позже начала');
      return;
    }
    if (isRangeOverlapping(startM, endM, selected.occupied)) {
      setTimeError('Время пересекается с занятыми слотами');
      return;
    }
    if (!isRangeWithinFree(startM, endM, selected.free)) {
      setTimeError('Время вне свободных слотов');
      return;
    }
    setTimeError('');
    setSubmitting(true);
    try {
      await createBooking(accessToken, {
        room_id: selected.roomId,
        title,
        description,
        date,
        start_time: selected.start,
        end_time: selected.end,
      });
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Link to="/book" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
      <h1 className="page-title">Бронирование по дате</h1>
      <p className="page-subtitle mb-6">Выберите дату и свободный слот</p>

      <div className="card mb-8 p-6">
        <p className="input-label mb-3">Дата (сегодня и ближайшие 2 недели)</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDate(opt.value)}
              className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all shrink-0 ${
                date === opt.value
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-slate-100 text-ink-secondary hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="block text-xs text-ink-muted mb-1.5">Или укажите вручную</label>
        <input
          type="date"
          value={date}
          min={dateMin}
          max={dateMax}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-sm text-ink-tertiary">Загрузка слотов...</p>
        </div>
      ) : !selected ? (
        <div className="space-y-5">
          {data.map(({ room, slots: free, occupied = [] }) => (
            <div key={room.id} className="card p-5">
              <div className="flex flex-wrap items-baseline gap-2 mb-3">
                <h3 className="font-semibold text-ink-primary">{room.name}</h3>
                <span className="text-sm text-ink-tertiary">· рассчитана на {room.capacity} чел.</span>
              </div>
              {occupied.length > 0 && (
                <p className="text-amber-700 text-sm mb-2">
                  Занято: {occupied.map((o) => `${o.start_time} – ${o.end_time}`).join(', ')}
                </p>
              )}
              <p className="section-title mb-2">Свободно</p>
              <div className="flex flex-wrap gap-2">
                {free.map((s) => (
                  <button
                    key={`${s.start_time}-${s.end_time}`}
                    type="button"
                    onClick={() => handleSelectRange(room.id, room.name, room.capacity, s.start_time, s.end_time, free, occupied)}
                    className="rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 border border-primary-100"
                  >
                    {s.start_time} – {s.end_time}
                  </button>
                ))}
                {free.length === 0 && <span className="text-ink-muted text-sm">Нет свободного времени</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 max-w-lg space-y-5 animate-slide-up">
          <p className="text-sm text-ink-secondary">
            <span className="font-semibold text-ink-primary">{selected.roomName}</span>
            <span className="mx-1.5">·</span>
            <span>{date}</span>
            <span className="ml-1.5 text-ink-tertiary">· на {selected.capacity} чел.</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Начало</label>
              <input
                type="time"
                value={selected.start}
                onChange={(e) => setSelected((s) => s ? { ...s, start: e.target.value } : null)}
                min="08:00"
                max="17:00"
                step="300"
                className="w-full"
              />
            </div>
            <div>
              <label className="input-label">Конец</label>
              <input
                type="time"
                value={selected.end}
                onChange={(e) => setSelected((s) => s ? { ...s, end: e.target.value } : null)}
                min="08:00"
                max="17:00"
                step="300"
                className="w-full"
              />
            </div>
          </div>
          {timeError && <p className="text-sm text-red-600">{timeError}</p>}
          <div>
            <label className="input-label">Название встречи *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Спринт-планнинг" className="w-full" />
          </div>
          <div>
            <label className="input-label">Описание *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Кратко, что будете обсуждать" className="w-full" required minLength={1} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSelected(null)} className="btn-secondary px-5 py-2.5">
              Назад
            </button>
            <button type="submit" disabled={submitting || !title.trim() || !description.trim()} className="btn-primary px-5 py-2.5">
              {submitting ? 'Создание...' : 'Забронировать'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
