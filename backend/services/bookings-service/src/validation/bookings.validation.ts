import { z } from "zod";

export const newBookingSchema = z.object({
  room_id: z
    .number()
    .int({ message: "ID комнаты должен быть целым числом" })
    .positive({ message: "ID комнаты должен быть положительным числом" }),

  title: z
    .string()
    .min(1, { message: "Название встречи обязательно" }),

  description: z
    .string()
    .min(1, { message: "Описание встречи обязательно" }),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Дата должна быть в формате YYYY-MM-DD" }),

  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Время начала должно быть в формате HH:MM" }),

  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Время окончания должно быть в формате HH:MM" }),
}).refine((data) => data.start_time < data.end_time, {
  message: "Время начала должно быть раньше времени окончания",
  path: ["end_time"],
});