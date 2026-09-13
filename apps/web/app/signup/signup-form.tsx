"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { croppedDataUrlToFile, uploadAvatar } from "@/lib/utils";
import { AvatarCropper } from "@/components/dashboard/avatar-cropper";
import { SignUpStepOne } from "./signup-step-1";
import { SignUpStepTwo } from "./signup-step-2";
import { useSignUpForm } from "@/lib/utils";

function PasswordSignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const form = useSignUpForm(async (value) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    try {
      let image: string | undefined;

      if (avatarFile) {
        image = await uploadAvatar(avatarFile);
      }

      const { error } = await authClient.signUp.email({
        name: value.name.trim(),
        email: value.email.trim(),
        username: value.username.trim(),
        password: value.password,
        bio: value.bio.trim() || undefined,
        image,
      });

      if (error) {
        console.error(error);
        toast.error(error.message);
        return;
      }

      router.push("/");
    } catch (error) {
      console.error("Email sign-up failed!", error);
      const message =
        error instanceof Error ? error.message : "Unable to create account.";
      toast.error(message);
    }
  });

  const handlePickFile = (file: File) => {
    setCropSource(URL.createObjectURL(file));
    setIsCropping(true);
  };

  const handleCropConfirm = (dataUrl: string) => {
    const file = croppedDataUrlToFile(dataUrl);
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
      <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
        Step {step} of 2
      </p>
      <form
        id="signup-password-form"
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {step === 1 ? (
          <SignUpStepOne form={form} />
        ) : (
          <SignUpStepTwo
            form={form}
            fileInputRef={fileInputRef}
            avatarPreview={avatarPreview}
            onPickFile={handlePickFile}
            onBack={() => setStep(1)}
          />
        )}
      </form>

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

export const SignUpForm = PasswordSignUpForm;
