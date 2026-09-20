import { ForgotPasswordForm } from "./forgot-password-form";
import { Logo } from "@/components/logo";
import { TypographyH4 } from "@workspace/ui/components/typography";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm border-none text-sm">
        <div className="mb-6 space-y-2 text-center">
          <Logo />
          <TypographyH4>Reset your password</TypographyH4>
        </div>
        <ForgotPasswordForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Remembered your password?{" "}
          <Link
            href="/signin"
            className="underline transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
