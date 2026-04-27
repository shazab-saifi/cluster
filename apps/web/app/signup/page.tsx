"use client";

import { Mail } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const GoogleSignIn = async () => {
    try {
      const { data, error } = await authClient.signIn.social({
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
  };

  const EmailSingIn = async () => {
    if (email.length == 0 || name.length == 0) {
      return alert("Please enter you email!");
    }
    try {
      // @ts-ignore
      const { data, error } = await authClient.signIn.magicLink({
        email: email.trim(),
        name: name.trim(),
        callbackUrl: "/",
        errorCallbackURL: "/error",
      });

      if (error) {
        console.log(error);
        return alert(error.message);
      }

      console.log(data);
    } catch (error) {
      console.error("Email sing-up failed!", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Email sign-up";
      alert(message);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Sign up with your email or continue with Google.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-12"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Carol Smith"
                  className="h-12"
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            </FieldGroup>

            <Button
              onClick={EmailSingIn}
              type="submit"
              size="lg"
              className="w-full py-6"
            >
              <Mail data-icon="inline-start" />
              Sign up
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-4 border-t-0 bg-transparent">
          <div className="flex w-full items-center gap-3 text-xs tracking-[0.22em] text-muted-foreground uppercase">
            <Separator className="flex-1" />
            <span>or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full py-6"
            onClick={GoogleSignIn}
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
        </CardFooter>
      </Card>
    </main>
  );
}
