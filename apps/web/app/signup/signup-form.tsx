"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

const SignUpFormSchema = z.object({
  email: z.email(),
  name: z
    .string()
    .min(3, "Name should have atleast 3 characters")
    .max(128, "Name cannot be more than 128 characters"),
});

export const SignUpForm = () => {
  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
    },
    validators: {
      onSubmit: SignUpFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.email.length == 0 || value.name.length == 0) {
        return alert("Please enter you email!");
      }
      try {
        // @ts-expect-error magicLink showing a ts error for some reason but the configuration is correct but magic link auth is working fine
        const { error } = await authClient.signIn.magicLink({
          email: value.email.trim(),
          name: value.name.trim(),
          callbackUrl: "/",
          errorCallbackURL: "/error",
        });

        if (error) {
          console.error(error);
          return alert(error.message);
        }
      } catch (error) {
        console.error("Email sing-up failed!", error);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to start Email sign-up";
        alert(message);
      }
    },
  });

  return (
    <div>
      <form
        id="signup-form"
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
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Enter your email"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Enter your name"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </form>
      <Button
        type="submit"
        form="signup-form"
        className="mt-5 w-full"
        size="lg"
      >
        Create Account
      </Button>
    </div>
  );
};
