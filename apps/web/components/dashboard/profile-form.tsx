"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { CameraIcon } from "@phosphor-icons/react";
import { updateMe } from "./api";
import { CLOUDFRONT_URL, getPresignedUrl, uploadToS3 } from "@/lib/utils";
import { AvatarCropper } from "./avatar-cropper";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { getInitials } from "@workspace/ui/lib/utils";
import type { DashboardUser } from "./types";

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

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be at most 50 characters."),
  bio: z
    .string()
    .max(160, "Bio must be at most 160 characters.")
    .or(z.literal("")),
});

export type ProfileFormHandle = {
  submit: () => void;
  isPending: boolean;
};

export function ProfileForm({
  user,
  ref,
  onPendingChange,
}: {
  user: DashboardUser;
  ref?: React.Ref<ProfileFormHandle>;
  onPendingChange?: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      name,
      bio,
      image,
    }: {
      name: string;
      bio: string;
      image?: string;
    }) => {
      return updateMe({ name, bio, image });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated successfully.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      name: user.name,
      bio: user.bio ?? "",
    },
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      const payload: Partial<Record<string, string>> = {};

      if (value.name !== user.name) {
        payload.name = value.name;
      }
      if (value.bio !== (user.bio ?? "")) {
        payload.bio = value.bio;
      }
      if (avatarFile) {
        const presignedUrl = await getPresignedUrl(
          avatarFile.name,
          avatarFile.type
        );
        console.log(presignedUrl.presignedUrl.url);
        const result = await uploadToS3(
          presignedUrl.presignedUrl.url,
          avatarFile
        );
        console.log(result);
        payload.image = `https://${CLOUDFRONT_URL}/${presignedUrl.presignedUrl.key}`;
      }

      await mutation.mutateAsync(
        payload as { name: string; bio: string; image?: string }
      );

      setAvatarFile(null);
      setAvatarPreview(null);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        form.handleSubmit();
      },
      isPending: mutation.isPending,
    }),
    [form, mutation.isPending]
  );

  useEffect(() => {
    onPendingChange?.(mutation.isPending);
  }, [mutation.isPending, onPendingChange]);

  const handleCropConfirm = (dataUrl: string) => {
    const file = new File([dataUrlToBlob(dataUrl)], "avatar.jpg", {
      type: "image/jpeg",
    });
    if (cropSource) URL.revokeObjectURL(cropSource);
    setAvatarFile(file);
    setAvatarPreview(dataUrl);
    setCropSource(null);
    setIsCropping(false);
  };

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
    setIsCropping(false);
  };

  return (
    <div className="relative">
      <form
        id="profile-form"
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className="mx-auto w-fit">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCropSource(URL.createObjectURL(file));
                setIsCropping(true);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative shrink-0 cursor-pointer"
            >
              <Avatar className="size-24">
                <AvatarImage
                  src={avatarPreview ?? user.image ?? undefined}
                  alt={user.name}
                />
                <AvatarFallback className="text-lg font-semibold text-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <CameraIcon className="size-6 text-white" weight="bold" />
              </span>
            </button>
          </div>

          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                  <Input
                    id="profile-name"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Your name"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <Field>
            <FieldLabel htmlFor="profile-username">Username</FieldLabel>
            <Input
              id="profile-username"
              value={user.username ?? ""}
              readOnly
              placeholder="No username yet."
            />
            <FieldDescription>Username is not editable.</FieldDescription>
          </Field>

          <form.Field name="bio">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
                  <Textarea
                    id="profile-bio"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Tell us a little about yourself."
                    className="min-h-28 resize-none"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <FieldDescription>
                    Brief description for your profile.
                  </FieldDescription>
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
      </form>

      {mutation.isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
          <LoaderCircle className="size-8 animate-spin text-foreground" />
        </div>
      )}

      {cropSource && isCropping && (
        <AvatarCropper
          open
          imageSrc={cropSource}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
