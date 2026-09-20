"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { emailSchema } from "@/lib/schemas";
import { APP_BASE_URL } from "@/lib/utils";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: ForgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await authClient.requestPasswordReset({
          email: value.email.trim(),
          redirectTo: `${APP_BASE_URL}/reset-password`,
        });

        if (error) {
          console.error(error);
          return toast.error(error.message);
        }

        setIsSubmitted(true);
      } catch (error) {
        console.error("Requesting password reset failed!", error);
        const message =
          error instanceof Error ? error.message : "Could not request a reset.";
        toast.error(message);
      }
    },
  });

  if (isSubmitted) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Check your email</p>
        <p className="mt-1 text-xs text-muted-foreground">
          If an account exists for that address, you&apos;ll receive a link to
          reset your password.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form
        id="forgot-password-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    type="email"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="your@example.com"
                    autoComplete="email"
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
        form="forgot-password-form"
        className="mt-5 w-full"
        size="lg"
      >
        Send reset link
      </Button>
    </div>
  );
}
