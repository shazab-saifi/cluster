import { Dashboard } from "@/components/dashboard/dashboard";

type ChannelPageProps = {
  params: Promise<{ networkId: string; channelId: string }>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { networkId, channelId } = await params;

  return <Dashboard networkId={networkId} channelId={channelId} />;
}
