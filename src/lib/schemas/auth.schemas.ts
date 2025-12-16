import { z } from "zod";

/**
 * Schema walidacji formularza logowania
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Schema walidacji formularza rejestracji
 */
export const registerFormSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email jest wymagany")
      .email("Nieprawidłowy format email")
      .max(255, "Email może mieć maksymalnie 255 znaków"),
    password: z
      .string()
      .min(1, "Hasło jest wymagane")
      .min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;

