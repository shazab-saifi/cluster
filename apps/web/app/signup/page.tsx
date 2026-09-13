import { SignUpForm } from "./signup-form";
import { Logo } from "@/components/logo";
import { TypographyH4 } from "@workspace/ui/components/typography";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm border-none text-sm">
        <div className="mb-6 space-y-2 text-center">
          <Logo />
          <TypographyH4>Create an account</TypographyH4>
        </div>
        <SignUpForm />
        <p className="mt-4 text-center text-xs text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="underline transition-colors hover:text-neutral-100"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
