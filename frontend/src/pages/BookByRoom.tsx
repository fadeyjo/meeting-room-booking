import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoom } from '../api/rooms';
import { getSlotsByRoom, createBooking } from '../api/bookings';
import type { Room } from '@shared/types';

export default function BookByRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const id = Number(roomId);
  const [room, setRoom] = useState<Room | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRoom(id, accessToken).then(setRoom);
  }, [id, accessToken]);

  useEffect(() => {
    if (!id) return;
    getSlotsByRoom(id, date, accessToken).then(setSlots);
  }, [id, date, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !room) return;
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={`${s.start_time}-${s.end_time}`}
                type="button"
                onClick={() => setSelectedSlot({ start: s.start_time, end: s.end_time })}
                className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100"
              >
                {s.start_time} – {s.end_time}
              </button>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-md">
          <p className="text-slate-600 text-sm">{room.name}, {date}, {selectedSlot.start} – {selectedSlot.end}</p>
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
