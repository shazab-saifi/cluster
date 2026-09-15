"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { checkUsernameAvailable } from "@/lib/api";
import { usernameSchema } from "@/lib/schemas";
import { SignUpForm } from "@/lib/utils";

export function UsernameField({ form }: { form: SignUpForm }) {
  const [username, setUsername] = useState("");

  const { debouncedValue: debouncedUsername } = useDebounce(username, 500);
  const shouldCheck = debouncedUsername.length >= 3;

  const { data, isPending: isChecking } = useQuery({
    queryKey: ["username-availability", debouncedUsername],
    queryFn: () => checkUsernameAvailable(debouncedUsername),
    enabled: shouldCheck,
    staleTime: 60_000,
  });

  const isTaken = !isChecking && data !== undefined && !data.available;

  return (
    <form.Field name="username" validators={{ onSubmit: usernameSchema }}>
      {(field) => {
        const isInvalid = !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid || isTaken}>
            <FieldLabel htmlFor={field.name} required>
              Username
            </FieldLabel>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  setUsername(e.target.value);
                  field.handleChange(e.target.value);
                }}
                aria-invalid={isInvalid || isTaken}
                placeholder="@your_username"
                autoComplete="username"
                className="pr-9"
                required
              />
              {shouldCheck && isChecking && (
                <LoaderCircle className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {!isChecking && data?.available && (
                <Check className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-green-500" />
              )}
            </div>
            {isInvalid ? (
              <FieldError
                className="text-xs"
                errors={field.state.meta.errors}
              />
            ) : isTaken ? (
              <FieldError
                className="text-xs"
                errors={[{ message: "This username is already taken." }]}
              />
            ) : null}
          </Field>
        );
      }}
    </form.Field>
  );
}
