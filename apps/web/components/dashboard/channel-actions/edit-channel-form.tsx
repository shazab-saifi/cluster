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
import type { Channel } from "../types";
import { editChannel } from "./api";
import { editChannelSchema } from "./schema";

type EditChannelFormProps = {
  channel: Channel;
  onCancel: () => void;
  onUpdated: () => void;
};

export function EditChannelForm({
  channel,
  onCancel,
  onUpdated,
}: EditChannelFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["network", channel.networkId],
      });
      onUpdated();
    },
  });

  const form = useForm({
    defaultValues: {
      name: channel.name,
    },
    validators: {
      onSubmit: editChannelSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        networkId: channel.networkId,
        channelId: channel.id,
        name: value.name,
      });
    },
  });

  return (
    <form
      id="edit-channel-form"
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
                <FieldLabel htmlFor="edit-channel-name">
                  Channel name
                </FieldLabel>
                <Input
                  id="edit-channel-name"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="announcements"
                  autoComplete="off"
                  autoFocus
                />
                <FieldDescription>
                  Rename this conversation space for everyone in the network.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
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
          {mutation.isPending ? "Saving" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
