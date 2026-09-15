"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { Button } from "@workspace/ui/components/button";

const PasswordSignInSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username cannot be more than 30 characters.")
    .regex(
      /^@[a-zA-Z0-9_.]+$/,
      "Username must start with @ and can only contain letters, numbers, underscores, and dots after that."
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password cannot be more than 128 characters."),
});

export const SignInForm = () => {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: PasswordSignInSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await authClient.signIn.username({
          username: value.username.trim(),
          password: value.password,
        });

        if (error) {
          console.error(error);
          return toast.error(error.message);
        }

        router.push("/");
      } catch (error) {
        console.error("Username sign-in failed!", error);
        const message =
          error instanceof Error ? error.message : "Unable to sign in.";
        toast.error(message);
      }
    },
  });

  return (
    <div>
      <form
        id="signin-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="username">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="@your_username"
                    autoComplete="username"
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
          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <PasswordInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
        form="signin-form"
        className="mt-5 w-full"
        size="lg"
      >
        Sign In
      </Button>
    </div>
  );
};
