"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { emailSchema, passwordSchema } from "@/lib/schemas";
import { SignUpForm } from "@/lib/utils";

function GoogleAuthSection() {
  return (
    <div className="mt-5 flex-col gap-4 border-t-0 bg-transparent">
      <div className="mb-5 flex w-full items-center gap-3 text-xs tracking-[0.22em] text-muted-foreground uppercase">
        <Separator className="flex-1" />
        <span>or</span>
        <Separator className="flex-1" />
      </div>

      <GoogleAuthButton />
    </div>
  );
}

export function SignUpStepOne({ form }: { form: SignUpForm }) {
  return (
    <>
      <FieldGroup>
        <form.Field name="email" validators={{ onSubmit: emailSchema }}>
          {(field) => {
            const isInvalid = !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name} required>
                  Email
                </FieldLabel>
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="password" validators={{ onSubmit: passwordSchema }}>
          {(field) => {
            const isInvalid = !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name} required>
                  Password
                </FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <Button type="submit" className="mt-5 w-full" size="lg">
        Next Step
      </Button>
      <GoogleAuthSection />
    </>
  );
}
