import { z } from "zod";

export const inviteSchema = z.object({
  booking_id: z
    .number()
    .int({ message: "ID бронирования — целое число" })
    .positive({ message: "ID бронирования — положительное" }),

  user_id: z
    .number()
    .int({ message: "id пользователя — целое число" })
    .positive({ message: "ID пользователя — положительное" }),

  role: z
    .string()
    .min(1, { message: "Задай роль" }),

  message: z
    .string()
    .min(1, { message: "Введи сообщение" }),
});

export const invitationRequestSchema = z.object({
  booking_id: z
    .number()
    .int()
    .positive(),

  user_id: z
    .number()
    .int()
    .positive(),

  role: z.string().min(1),

  message: z.string().optional().default(""),
});