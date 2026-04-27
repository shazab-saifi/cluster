"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";

export default function Page() {
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      const res = await authClient.signOut();

      if (res.error) {
        console.log(res.error);
        return alert(res.error.message);
      }

      alert("Signed Out Successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>
            {session?.user.name}, You may now add components and start building.
          </p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
          {session?.user && (
            <Button onClick={handleSignOut} variant="secondary">
              Sign Out
            </Button>
          )}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
