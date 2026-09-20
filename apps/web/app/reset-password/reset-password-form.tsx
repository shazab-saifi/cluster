"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { passwordSchema } from "@/lib/schemas";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { Button } from "@workspace/ui/components/button";

const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: ResetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });

        if (error) {
          console.error(error);
          return toast.error(error.message);
        }

        toast.success("Password updated. Please sign in.");
        router.push("/signin");
      } catch (error) {
        console.error("Resetting password failed!", error);
        const message =
          error instanceof Error ? error.message : "Could not reset password.";
        toast.error(message);
      }
    },
  });

  return (
    <div>
      <form
        id="reset-password-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <PasswordInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />
                  {isInvalid && (
                    <FieldError
                      className="text-xs"
                      errors={field.state.meta.errors}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="confirmPassword">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                  <PasswordInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    required
                  />
                  {isInvalid && (
                    <FieldError
                      className="text-xs"
                      errors={field.state.meta.errors}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </form>
      <Button
        type="submit"
        form="reset-password-form"
        className="mt-5 w-full"
        size="lg"
      >
        Reset password
      </Button>
    </div>
  );
}
