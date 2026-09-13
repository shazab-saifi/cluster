"use client";

import type { RefObject } from "react";
import { ArrowBendUpLeftIcon, CameraIcon } from "@phosphor-icons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { bioSchema, nameSchema, usernameSchema } from "@/lib/schemas";
import { SignUpForm } from "@/lib/utils";

type SignUpStepTwoProps = {
  form: SignUpForm;
  fileInputRef: RefObject<HTMLInputElement | null>;
  avatarPreview: string | null;
  onPickFile: (file: File) => void;
  onBack: () => void;
};

export function SignUpStepTwo({
  form,
  fileInputRef,
  avatarPreview,
  onPickFile,
  onBack,
}: SignUpStepTwoProps) {
  return (
    <>
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
              onPickFile(file);
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
                src={avatarPreview ?? undefined}
                alt="Avatar preview"
              />
              <AvatarFallback className="text-lg font-semibold text-foreground">
                ?
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <CameraIcon className="size-6 text-white" weight="bold" />
            </span>
          </button>
        </div>
        <form.Field name="name" validators={{ onSubmit: nameSchema }}>
          {(field) => {
            const isInvalid = !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name} required>
                  Name
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="username" validators={{ onSubmit: usernameSchema }}>
          {(field) => {
            const isInvalid = !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name} required>
                  Username
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="your_username"
                  autoComplete="username"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="bio" validators={{ onSubmit: bioSchema }}>
          {(field) => {
            const isInvalid = !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Tell people a bit about yourself (optional)"
                  autoComplete="off"
                  maxLength={160}
                  rows={3}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <Button type="submit" className="mt-5 w-full" size="lg">
        Create Account
      </Button>
      <Button
        type="button"
        variant="ghost"
        aria-label="Back to email and password"
        onClick={onBack}
        className="absolute top-0 -left-64 text-neutral-400 transition-colors hover:text-neutral-300"
      >
        <ArrowBendUpLeftIcon className="size-4" />
        Back
      </Button>
    </>
  );
}
