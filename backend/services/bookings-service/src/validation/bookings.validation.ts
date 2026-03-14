import { z } from "zod";

export const newBookingSchema = z.object({
  room_id: z
    .number()
    .int({ message: "ID комнаты — целое число" })
    .positive({ message: "ID комнаты — положительное" }),

  title: z
    .string()
    .min(1, { message: "Название встречи обязательно" }),

  description: z
    .string()
    .min(1, { message: "Описание встречи обязательно" }),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Дата в формате YYYY-MM-DD" }),

  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Время начала в формате HH:MM" }),

  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Время окончания в формате HH:MM" }),
}).refine((data) => data.start_time < data.end_time, {
  message: "Начало должно быть раньше конца",
  path: ["end_time"],
});