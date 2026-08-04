"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Copy, LoaderCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { createInvite } from "./api";
import { createInviteSchema, type InviteExpiry } from "./schema";

type AddMemberFormProps = {
  networkId: string;
  onCancel: () => void;
};

const EXPIRY_OPTIONS: Array<{
  value: InviteExpiry;
  label: string;
}> = [
  {
    value: "10m",
    label: "10 minutes",
  },
  {
    value: "30m",
    label: "30 minutes",
  },
  {
    value: "1h",
    label: "1 hour",
  },
  {
    value: "1d",
    label: "1 day",
  },
];

export function AddMemberForm({ networkId, onCancel }: AddMemberFormProps) {
  const mutation = useMutation({
    mutationFn: createInvite,
  });

  const form = useForm({
    defaultValues: {
      expiresIn: "30m" as InviteExpiry,
    },
    validators: {
      onSubmit: createInviteSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        networkId,
        expiresIn: value.expiresIn,
      });
    },
  });

  const inviteLink = mutation.data?.inviteLink;

  return (
    <form
      id="add-member-form"
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="expiresIn">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <FieldSet>
                <FieldLegend>Invite expiry</FieldLegend>
                <FieldDescription>
                  Links can be used up to 10 times before they stop working.
                </FieldDescription>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as InviteExpiry)
                  }
                  aria-invalid={isInvalid}
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <FieldLabel key={option.value}>
                      <Field orientation="horizontal">
                        <RadioGroupItem value={option.value} />
                        {option.label}
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </FieldSet>
            );
          }}
        </form.Field>
      </FieldGroup>

      {mutation.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutation.error.message}
        </div>
      )}

      {inviteLink && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
          <p className="text-sm font-medium">Invite link</p>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-background px-3 py-2 text-xs">
              {inviteLink}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy invite link"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
            >
              <Copy data-icon="inline-start" />
            </Button>
          </div>
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
          {mutation.isPending && (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          )}
          {inviteLink ? "Create New Link" : "Create Invite Link"}
        </Button>
      </div>
    </form>
  );
}
