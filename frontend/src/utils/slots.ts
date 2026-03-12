export interface TimeSlotLike {
  start_time: string;
  end_time: string;
}

export function toHourlySlots(slots: TimeSlotLike[]): TimeSlotLike[] {
  const result: TimeSlotLike[] = [];
  for (const s of slots) {
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    let startM = sh * 60 + (sm ?? 0);
    const endM = eh * 60 + (em ?? 0);
    while (startM + 60 <= endM) {
      const h = Math.floor(startM / 60);
      const m = startM % 60;
      const nextM = startM + 60;
      const nh = Math.floor(nextM / 60);
      const nm = nextM % 60;
      result.push({
        start_time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        end_time: `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`,
      });
      startM = nextM;
    }
  }
  return result;
}
