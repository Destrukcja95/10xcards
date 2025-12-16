import { useState, useCallback } from "react";
import type { ZodSchema, ZodError } from "zod";

interface UseAuthFormOptions<T extends Record<string, unknown>> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (data: T) => Promise<void>;
}

interface UseAuthFormReturn<T extends Record<string, unknown>> {
  formData: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldError: (field: keyof T, message: string) => void;
  resetForm: () => void;
}

/**
 * Custom hook do obsługi formularzy autoryzacji z walidacją Zod.
 * Zapewnia walidację inline przy blur i przy submit.
 */
export function useAuthForm<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Waliduje pojedyncze pole i zwraca błąd (jeśli istnieje)
   */
  const validateField = useCallback(
    (field: keyof T, value: unknown): string | undefined => {
      try {
        // Tworzymy tymczasowy obiekt z aktualnym polem do walidacji
        const tempData = { ...formData, [field]: value };
        schema.parse(tempData);
        return undefined;
      } catch (error) {
        if (error instanceof Error && "errors" in error) {
          const zodError = error as ZodError;
          const fieldError = zodError.errors.find((err) => err.path[0] === field);
          return fieldError?.message;
        }
        return undefined;
      }
    },
    [formData, schema]
  );

  /**
   * Waliduje cały formularz i zwraca błędy
   */
  const validateForm = useCallback((): Partial<Record<keyof T, string>> => {
    try {
      schema.parse(formData);
      return {};
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const zodError = error as ZodError;
        const formErrors: Partial<Record<keyof T, string>> = {};
        for (const err of zodError.errors) {
          const field = err.path[0] as keyof T;
          if (!formErrors[field]) {
            formErrors[field] = err.message;
          }
        }
        return formErrors;
      }
      return {};
    }
  }, [formData, schema]);

  /**
   * Handler zmiany wartości pola
   */
  const handleChange = useCallback(
    (field: keyof T) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Jeśli pole było dotknięte i miało błąd, waliduj podczas pisania
        if (touched[field] && errors[field]) {
          const fieldError = validateField(field, value);
          setErrors((prev) => ({
            ...prev,
            [field]: fieldError,
          }));
        }
      },
    [touched, errors, validateField]
  );

  /**
   * Handler blur - oznacza pole jako dotknięte i waliduje
   */
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const fieldError = validateField(field, formData[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: fieldError,
      }));
    },
    [formData, validateField]
  );

  /**
   * Handler submit formularza
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Oznacz wszystkie pola jako dotknięte
      const allTouched = Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      );
      setTouched(allTouched);

      // Waliduj formularz
      const formErrors = validateForm();
      setErrors(formErrors);

      // Jeśli są błędy, nie wysyłaj
      if (Object.keys(formErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, initialValues, validateForm, onSubmit]
  );

  /**
   * Ustawia błąd dla konkretnego pola (np. z API)
   */
  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  /**
   * Resetuje formularz do stanu początkowego
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
    resetForm,
  };
}

