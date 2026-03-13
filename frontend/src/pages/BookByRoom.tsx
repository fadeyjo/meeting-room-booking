import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoom } from '../api/rooms';
import { getSlotsByRoom, createBooking } from '../api/bookings';
import { isRangeOverlapping, isRangeWithinFree, timeToMinutes, getBookingDateLimits, getBookingDateOptions } from '../utils/slots';
import type { Room, TimeSlot } from '@shared/types';

export default function BookByRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const id = Number(roomId);
  const { min: dateMin, max: dateMax } = useMemo(() => getBookingDateLimits(), []);
  const dateOptions = useMemo(() => getBookingDateOptions(), []);
  const [room, setRoom] = useState<Room | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [free, setFree] = useState<TimeSlot[]>([]);
  const [occupied, setOccupied] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (date < dateMin || date > dateMax) setDate(dateMin);
  }, [date, dateMin, dateMax]);

  useEffect(() => {
    if (!id) return;
    getRoom(id, accessToken).then(setRoom);
  }, [id, accessToken]);

  useEffect(() => {
    if (!id) return;
    getSlotsByRoom(id, date, accessToken).then((res) => {
      setFree(res.free);
      setOccupied(res.occupied);
      setSelectedSlot(null);
    });
  }, [id, date, accessToken]);

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
      setTimeError('Время окончания должно быть позже времени начала');
      return;
    }
    if (isRangeOverlapping(startM, endM, occupied)) {
      setTimeError('Выбранное время пересекается с занятыми интервалами');
      return;
    }
    if (!isRangeWithinFree(startM, endM, free)) {
      setTimeError('Выбранное время выходит за пределы свободных интервалов');
      return;
    }
    setTimeError('');
    setSubmitting(true);
    try {
      await createBooking(accessToken, {
        room_id: room.id,
        title,
        description,
        date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      });
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) return <p className="text-slate-500">Загрузка...</p>;

  return (
    <div className="w-full py-6">
      <Link to="/book/by-room" className="text-primary-600 text-sm font-medium mb-4 inline-block">← Назад</Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{room.name}</h1>
      <p className="text-slate-500 text-sm mb-6">Выбери дату и время</p>

      {!selectedSlot ? (
        <>
          <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-700 mb-3">Выберите дату (сегодня и ближайшие 2 недели)</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {dateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDate(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    date === opt.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="block text-xs text-slate-500 mb-1">Или укажите дату вручную</label>
            <input
              type="date"
              value={date}
              min={dateMin}
              max={dateMax}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-[200px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-shadow"
            />
          </div>
          {occupied.length > 0 && (
            <p className="text-amber-700 text-sm mb-2">
              Занято: {occupied.map((o) => `${o.start_time} – ${o.end_time}`).join(', ')}
            </p>
          )}
          <p className="text-slate-500 text-sm mb-2">Свободно:</p>
          <div className="flex flex-wrap gap-2">
            {free.map((s) => (
              <button
                key={`${s.start_time}-${s.end_time}`}
                type="button"
                onClick={() => handleSelectRange(s.start_time, s.end_time)}
                className="px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 border border-primary-100"
              >
                {s.start_time} – {s.end_time}
              </button>
            ))}
            {free.length === 0 && <span className="text-slate-500 text-sm">На эту дату нет свободного времени</span>}
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-md">
          <p className="text-slate-600 text-sm mb-1">
            <span className="font-medium text-slate-800">{room.name}</span>
            <span className="mx-1">·</span>
            <span>{date}</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Начало</label>
              <input
                type="time"
                value={selectedSlot.start}
                onChange={(e) => setSelectedSlot((s) => s ? { ...s, start: e.target.value } : null)}
                min="08:00"
                max="17:00"
                step="300"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Конец</label>
              <input
                type="time"
                value={selectedSlot.end}
                onChange={(e) => setSelectedSlot((s) => s ? { ...s, end: e.target.value } : null)}
                min="08:00"
                max="17:00"
                step="300"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>
          {timeError && <p className="text-red-600 text-sm">{timeError}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название встречи *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelectedSlot(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700">Назад</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50">{submitting ? 'Создание...' : 'Забронировать'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
