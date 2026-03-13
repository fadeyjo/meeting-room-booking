import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Некорректный формат email",
    }),
  password: z.string().min(8, { message: "Пароль должен быть минимум 8 символов" }),
});

export const registerSchema = z.object({
  email: z
    .string()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Некорректный формат email",
    }),

  phoneNumber: z.string().min(1, { message: "Номер телефона обязателен" }),

  birth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Некорректный формат даты рождения",
    }),

  lastName: z.string().min(1, { message: "Фамилия обязательна" }),

  firstName: z.string().min(1, { message: "Имя обязательно" }),

  patronymic: z.string().optional().nullable(),

  position: z.string().min(1, { message: "Должность обязательна" }),

  password: z.string().min(8, { message: "Пароль должен быть минимум 8 символов" }),

  roleName: z.string().min(1, { message: "Роль обязательна" }),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, { message: "Токен обновления обязателен" }),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, { message: "Токен обновления обязателен" }),
});

export const redactPersonSchema = z
  .object({
    email: z
      .string()
      .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Некорректный формат email",
      })
      .optional(),

    phoneNumber: z.string().min(1, { message: "Номер телефона обязателен" }).optional(),

    birth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Некорректный формат даты рождения",
      })
      .optional(),

    lastName: z.string().min(1, { message: "Фамилия обязательна" }).optional(),

    firstName: z.string().min(1, { message: "Имя обязательно" }).optional(),

    patronymic: z
      .string()
      .trim()
      .min(1, { message: "Отчество должно быть не пустым" })
      .optional()
      .nullable(),

    position: z.string().min(1, { message: "Должность обязательна" }).optional(),

    password: z.string().min(8, { message: "Пароль должен быть минимум 8 символов" }).optional(),

    roleName: z.string().min(1, { message: "Роль обязательна" }).optional(),

    firedAt: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Некорректный формат даты увольнения",
      })
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Должен быть хотя бы один изменяемый параметр",
  });