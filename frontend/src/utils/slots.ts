export interface TimeSlotLike {
  start_time: string;
  end_time: string;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isRangeOverlapping(startM: number, endM: number, occupied: TimeSlotLike[]): boolean {
  return occupied.some((o) => {
    const oStart = timeToMinutes(o.start_time);
    const oEnd = timeToMinutes(o.end_time);
    return startM < oEnd && endM > oStart;
  });
}

export function isRangeWithinFree(startM: number, endM: number, free: TimeSlotLike[]): boolean {
  return free.some((f) => {
    const fStart = timeToMinutes(f.start_time);
    const fEnd = timeToMinutes(f.end_time);
    return startM >= fStart && endM <= fEnd;
  });
}

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function getBookingDateLimits(): { min: string; max: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + 14);
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  return { min: toYMD(today), max: toYMD(max) };
}

export function getBookingDateOptions(): { value: string; label: string; isToday: boolean }[] {
  const { min, max } = getBookingDateLimits();
  const result: { value: string; label: string; isToday: boolean }[] = [];
  const start = new Date(min + 'T12:00:00');
  const end = new Date(max + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ymd = d.toISOString().slice(0, 10);
    const dayNum = d.getDate();
    const wd = WEEKDAY_SHORT[d.getDay()];
    const isToday = d.getTime() === today.getTime();
    result.push({
      value: ymd,
      label: isToday ? 'Сегодня' : `${dayNum} ${wd}`,
      isToday,
    });
  }
  return result;
}
