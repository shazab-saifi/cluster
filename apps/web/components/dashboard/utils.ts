import type { DashboardUser, NetworkListItem } from "./types";

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getNetworkList(user: DashboardUser | undefined) {
  if (!user) return [];

  const ownedNetworks = user.networks.map((network) => ({
    ...network,
    role: "OWNER" as const,
  }));

  const memberNetworks = user.memberships
    .map((membership) =>
      membership.network
        ? {
            ...membership.network,
            role: membership.role,
          }
        : null
    )
    .filter((network): network is NetworkListItem => Boolean(network));

  return Array.from(
    new Map(
      [...ownedNetworks, ...memberNetworks].map((network) => [
        network.id,
        network,
      ])
    ).values()
  );
}
