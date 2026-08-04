import { Dashboard } from "@/components/dashboard/dashboard";

type NetworkPageProps = {
  params: Promise<{ networkId: string }>;
};

export default async function NetworkPage({ params }: NetworkPageProps) {
  const { networkId } = await params;

  return <Dashboard networkId={networkId} />;
}
