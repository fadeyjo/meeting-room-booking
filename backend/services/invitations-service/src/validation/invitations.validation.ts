import { z } from "zod";

export const inviteSchema = z.object({
  booking_id: z
    .number()
    .int({ message: "ID бронирования должен быть целым числом" })
    .positive({ message: "ID бронирования должен быть положительным" }),

  user_id: z
    .number()
    .int({ message: "ID пользователя должен быть целым числом" })
    .positive({ message: "ID пользователя должен быть положительным" }),

  role: z
    .string()
    .min(1, { message: "Задайте роль" }),

  message: z
    .string()
    .min(1, { message: "Введлите сообщение" }),
});