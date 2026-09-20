import { Logo } from "@/components/logo";
import { TypographyH4 } from "@workspace/ui/components/typography";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm border-none text-center text-sm">
          <div className="mb-6 space-y-2">
            <Logo />
            <TypographyH4>Invalid reset link</TypographyH4>
          </div>
          <p className="text-xs text-muted-foreground">
            This password reset link is missing or no longer valid. Request a
            new one to continue.
          </p>
          <Button asChild type="button" className="mt-5 w-full" size="lg">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm border-none text-sm">
        <div className="mb-6 space-y-2 text-center">
          <Logo />
          <TypographyH4>Choose a new password</TypographyH4>
        </div>
        <ResetPasswordForm token={token} />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Back to{" "}
          <Link
            href="/signin"
            className="underline transition-colors hover:text-foreground"
          >
            sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
