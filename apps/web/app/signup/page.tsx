import { SignUpForm } from "./signup-form";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Logo } from "@/components/logo";
import { Separator } from "@workspace/ui/components/separator";
import { TypographyH4 } from "@workspace/ui/components/typography";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm border-none text-sm">
        <div className="mb-6 space-y-2 text-center">
          <Logo />
          <TypographyH4>Create an account</TypographyH4>
          <p className="text-sm text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="underline transition-colors hover:text-neutral-300"
            >
              Sign in
            </Link>
          </p>
        </div>

        <SignUpForm />
        <div className="mt-5 flex-col gap-4 border-t-0 bg-transparent">
          <div className="mb-5 flex w-full items-center gap-3 text-xs tracking-[0.22em] text-muted-foreground uppercase">
            <Separator className="flex-1" />
            <span>or</span>
            <Separator className="flex-1" />
          </div>

          <GoogleAuthButton />
        </div>
      </div>
    </main>
  );
}
