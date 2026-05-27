"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { createNetwork } from "./api";
import { createNetworkSchema } from "./schema";

type CreateNetworkFormProps = {
  onCancel: () => void;
  onCreated: () => void;
};

const NETWORK_TYPES = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Anyone can discover this network.",
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only invited members can join.",
  },
] as const;

export function CreateNetworkForm({
  onCancel,
  onCreated,
}: CreateNetworkFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createNetwork,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      onCreated();
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      image: "",
      type: "PUBLIC" as "PUBLIC" | "PRIVATE",
    },
    validators: {
      onSubmit: createNetworkSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form
      id="create-network-form"
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Network name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Design Circle"
                  autoComplete="off"
                />
                <FieldDescription>
                  Choose a short name that members will recognize.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="image">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Image URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="https://example.com/network.png"
                  autoComplete="off"
                />
                <FieldDescription>
                  Optional icon for the network strip.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel>Network type</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {NETWORK_TYPES.map((type) => {
                  const isSelected = field.state.value === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left transition hover:bg-muted",
                        isSelected && "border-primary bg-primary/10"
                      )}
                      onClick={() => field.handleChange(type.value)}
                    >
                      <span className="block text-sm font-semibold">
                        {type.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {type.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      {mutation.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutation.error.message}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating" : "Create Network"}
        </Button>
      </div>
    </form>
  );
}
