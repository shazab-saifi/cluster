import {
  UserIcon,
  GlobeIcon,
  UsersIcon,
  GearIcon,
} from "@phosphor-icons/react";

export const tabs = [
  { id: "account", label: "Account", icon: UserIcon },
  { id: "networks", label: "Networks", icon: GlobeIcon },
  { id: "friends", label: "Friends", icon: UsersIcon },
  { id: "settings", label: "Settings", icon: GearIcon },
] as const;

export type TabId = (typeof tabs)[number]["id"];
