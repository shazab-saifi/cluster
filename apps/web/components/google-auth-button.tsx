"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";

export const GoogleAuthButton = () => {
  async function handleGoogleSignIn() {
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (error) {
        console.log(error);
        return alert(error.message);
      }
    } catch (error) {
      console.error("Google sign-up failed", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-up";
      alert(message);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full bg-neutral-950"
      onClick={handleGoogleSignIn}
    >
      <Image
        width={20}
        height={20}
        src="https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B"
        alt="google-logo"
        className="mr-1"
      />
      Continue with Google
    </Button>
  );
};
