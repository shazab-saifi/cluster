import { authClient } from "@/lib/auth-client";
import { NetworkPreviewCard } from "../network-preview-card";

const InvitePage = async ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;
  const session = await authClient.getSession();

  return (
    <div className="flex h-svh w-screen items-center justify-center bg-background px-5">
      <NetworkPreviewCard token={token} isLoggedIn={!!session} />
    </div>
  );
};

export default InvitePage;
