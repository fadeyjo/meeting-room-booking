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
const TZ_MOSCOW = 'Europe/Moscow';

function getTodayMSK(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ_MOSCOW });
}

export function getBookingDateLimits(): { min: string; max: string } {
  const min = getTodayMSK();
  const d = new Date(min + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 14);
  const max = d.toISOString().slice(0, 10);
  return { min, max };
}

export function getBookingDateOptions(): { value: string; label: string; isToday: boolean }[] {
  const { min, max } = getBookingDateLimits();
  const result: { value: string; label: string; isToday: boolean }[] = [];
  const todayMSK = getTodayMSK();
  const start = new Date(min + 'T12:00:00Z');
  const end = new Date(max + 'T12:00:00Z');
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const ymd = d.toISOString().slice(0, 10);
    const dayNum = d.getUTCDate();
    const wd = WEEKDAY_SHORT[d.getUTCDay()];
    const isToday = ymd === todayMSK;
    result.push({
      value: ymd,
      label: isToday ? 'Сегодня' : `${dayNum} ${wd}`,
      isToday,
    });
  }
  return result;
}
