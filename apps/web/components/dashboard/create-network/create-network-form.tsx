"use client";

import { useRef, useState } from "react";
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
import { Image } from "lucide-react";
import { CameraIcon } from "@phosphor-icons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import { AvatarCropper } from "../avatar-cropper";
import { createNetwork } from "./api";
import { createNetworkSchema, CreateNetworkValues } from "./schema";
import { Textarea } from "@workspace/ui/components/textarea";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta?.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64!);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
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
      desc: "",
      image: undefined,
      type: "PUBLIC" as "PUBLIC" | "PRIVATE",
    } as CreateNetworkValues,
    validators: {
      onSubmit: createNetworkSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
    setIsCropping(false);
  };

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
        <form.Field name="image">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <div className="flex justify-center">
                  <input
                    ref={fileInputRef}
                    id={field.name}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setCropSource(URL.createObjectURL(file));
                      setIsCropping(true);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Upload a network avatar"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="size-20">
                      <AvatarImage
                        src={cropPreview ?? undefined}
                        alt="Network avatar"
                      />
                      <AvatarFallback className="text-lg font-semibold text-foreground">
                        {getInitials(form.state.values.name?.trim() ?? "") || (
                          <Image className="size-6 text-muted-foreground" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <CameraIcon className="size-6 text-white" weight="bold" />
                    </span>
                  </button>
                </div>
                <FieldDescription className="text-center">
                  Optional, select an avatar for the network and crop it.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}

                {cropSource && isCropping && (
                  <AvatarCropper
                    open
                    imageSrc={cropSource}
                    onCancel={handleCropCancel}
                    onConfirm={(dataUrl) => {
                      const file = new File(
                        [dataUrlToBlob(dataUrl)],
                        "avatar.jpg",
                        { type: "image/jpeg" }
                      );
                      field.handleChange(file);
                      setCropPreview(dataUrl);
                      if (cropSource) URL.revokeObjectURL(cropSource);
                      setCropSource(null);
                      setIsCropping(false);
                    }}
                  />
                )}
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
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Design Circle"
                  autoComplete="off"
                  required
                />
                <FieldDescription>
                  Choose a short name that members will recognize.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="desc">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  id={field.name}
                  placeholder="Write network description here."
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  required
                />
                <FieldDescription>
                  Add a description for your network.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel>Type</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {NETWORK_TYPES.map((type) => {
                  const isSelected = field.state.value === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left transition hover:bg-muted",
                        isSelected &&
                          "border-primary bg-primary/10 ring-3 ring-ring/50"
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
