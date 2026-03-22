import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@mrb/store';
import { useCreateBookingMutation, useGetRoomQuery, useGetSlotsByRoomQuery } from '@mrb/store';
import { isRangeOverlapping, isRangeWithinFree, timeToMinutes, getBookingDateLimits, getBookingDateOptions } from '../utils/slots';

export default function BookByRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const id = Number(roomId);
  const { min: dateMin, max: dateMax } = useMemo(() => getBookingDateLimits(), []);
  const dateOptions = useMemo(() => getBookingDateOptions(), []);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: room, isLoading: roomLoading } = useGetRoomQuery(id, { skip: !id || isDemo });
  const { data: slotsData } = useGetSlotsByRoomQuery(
    { roomId: id, date },
    { skip: !id || isDemo }
  );
  const free = slotsData?.free ?? [];
  const occupied = slotsData?.occupied ?? [];
  const [createBookingMu] = useCreateBookingMutation();
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (date < dateMin || date > dateMax) setDate(dateMin);
  }, [date, dateMin, dateMax]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [id, date]);

  const handleSelectRange = (start: string, end: string) => {
    setSelectedSlot({ start, end });
    setTimeError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !room) return;
    const startM = timeToMinutes(selectedSlot.start);
    const endM = timeToMinutes(selectedSlot.end);
    if (startM >= endM) {
      setTimeError('Конец должен быть позже начала');
      return;
    }
    if (isRangeOverlapping(startM, endM, occupied)) {
      setTimeError('Время пересекается с занятыми слотами');
      return;
    }
    if (!isRangeWithinFree(startM, endM, free)) {
      setTimeError('Время вне свободных слотов');
      return;
    }
    setTimeError('');
    setSubmitting(true);
    try {
      await createBookingMu({
        room_id: room.id,
        title,
        description,
        date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      }).unwrap();
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  if (isDemo) {
    return (
      <div className="w-full">
        <Link to="/book/by-room" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
        <div className="card p-8 text-ink-secondary">
          В демо-режиме бронирование недоступно. Войдите под учётной записью из seed-скрипта
        </div>
      </div>
    );
  }

  if (!room && roomLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  if (!room) {
    return <p className="text-ink-tertiary">Комната не найдена</p>;
  }

  return (
    <div className="w-full">
      <Link to="/book/by-room" className="btn-ghost mb-6 inline-flex text-sm">← Назад</Link>
      <h1 className="page-title">{room.name}</h1>
      <p className="page-subtitle mb-6">Рассчитана на {room.capacity} чел. · Выберите дату и время</p>

      {!selectedSlot ? (
        <>
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
                onClick={() => handleSelectRange(s.start_time, s.end_time)}
                className="rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 border border-primary-100"
              >
                {s.start_time} – {s.end_time}
              </button>
            ))}
            {free.length === 0 && <span className="text-ink-muted text-sm">На эту дату нет свободного времени</span>}
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 max-w-lg space-y-5 animate-slide-up">
          <p className="text-sm text-ink-secondary">
            <span className="font-semibold text-ink-primary">{room.name}</span>
            <span className="mx-1.5">·</span>
            <span>{date}</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Начало</label>
              <input
                type="time"
                value={selectedSlot.start}
                onChange={(e) => setSelectedSlot((s) => s ? { ...s, start: e.target.value } : null)}
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
                value={selectedSlot.end}
                onChange={(e) => setSelectedSlot((s) => s ? { ...s, end: e.target.value } : null)}
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="input-label">Описание *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full" required minLength={1} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSelectedSlot(null)} className="btn-secondary px-5 py-2.5">
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
