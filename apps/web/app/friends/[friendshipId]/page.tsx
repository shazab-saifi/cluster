import { FriendsDashboard } from "@/components/dashboard/friends-dashboard";

type FriendshipDmPageProps = {
  params: Promise<{ friendshipId: string }>;
};

export default async function FriendshipDmPage({
  params,
}: FriendshipDmPageProps) {
  const { friendshipId } = await params;

  return <FriendsDashboard friendshipId={friendshipId} />;
}
