import { z } from "zod"

export const loginSchema = z.object({
  email: z.string()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Некорректный формат email"
    }),
  password: z.string().min(8)
})

export const registerSchema = z.object({
  email: z
    .string()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Некорректный формат email"
    }),

  phoneNumber: z
    .string()
    .min(1),

  birth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Некорректный формат даты рождения"
    }),

  lastName: z
    .string()
    .min(1),

  firstName: z
    .string()
    .min(1),

  patronymic: z
    .string()
    .trim()
    .min(1)
    .optional(),

  position: z
    .string()
    .min(1),

  password: z
    .string()
    .min(1),

  roleName: z
    .string()
    .min(1)
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1)
})

export const logoutSchema = z.object({
    refreshToken: z.string().min(1)
})