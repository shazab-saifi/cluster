"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { Input } from "@workspace/ui/components/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import { API_BASE_URL } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { removeMemberFromNetwork, updateMemberRole } from "../api";
import axios from "axios";
import type { NetworkRole } from "../types";

type Member = {
  id: string;
  userId: string;
  networkId: string;
  role: NetworkRole;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
};

type SearchMembersResponse = {
  members: Member[];
  nextCursor: string | null;
};

const ROLE_BADGES: Record<NetworkRole, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-secondary text-secondary-foreground",
  MODERATOR: "bg-muted text-muted-foreground",
  MEMBER: "bg-muted text-muted-foreground",
};

const ROLE_LABELS: Record<NetworkRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  MEMBER: "Member",
};

const ROLE_ORDER: Record<NetworkRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MODERATOR: 2,
  MEMBER: 3,
};

const badgeClasses = (role: NetworkRole) =>
  cn(
    "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
    ROLE_BADGES[role]
  );

async function searchMembers(
  networkId: string,
  query: string,
  signal?: AbortSignal
) {
  const res = await axios.get<SearchMembersResponse>(
    `${API_BASE_URL}/networks/${networkId}/members/search?q=${encodeURIComponent(query)}`,
    { withCredentials: true, signal }
  );
  return res.data;
}

function sortByRole(members: Member[]) {
  return [...members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
}

function getRoleOptions(
  viewerRole: NetworkRole | undefined,
  targetRole: NetworkRole
): NetworkRole[] {
  if (viewerRole === "OWNER") return ["ADMIN", "MODERATOR", "MEMBER"];
  if (viewerRole === "ADMIN" && targetRole === "MODERATOR")
    return ["MODERATOR", "MEMBER"];
  if (viewerRole === "ADMIN" && targetRole === "MEMBER")
    return ["MODERATOR", "MEMBER"];
  return [];
}

function canEditRole(
  viewerRole: NetworkRole | undefined,
  targetRole: NetworkRole,
  isSelf: boolean
) {
  if (!viewerRole || isSelf || targetRole === "OWNER") return false;
  if (viewerRole === "OWNER") return true;
  if (viewerRole === "ADMIN" && targetRole !== "ADMIN") return true;
  return false;
}

function canRemoveMember(
  viewerRole: NetworkRole | undefined,
  targetRole: NetworkRole,
  isSelf: boolean
) {
  if (!viewerRole || isSelf || targetRole === "OWNER") return false;
  return (
    viewerRole === "OWNER" ||
    viewerRole === "ADMIN" ||
    viewerRole === "MODERATOR"
  );
}

function MemberRowSkeleton() {
  return (
    <div className="flex min-h-14 items-center gap-3 px-3 py-2">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-28" />
      <div className="ml-auto">
        <Skeleton className="h-5 w-16 rounded" />
      </div>
    </div>
  );
}

type MemberRowProps = {
  member: Member;
  currentUserId?: string;
  currentUserRole?: NetworkRole;
  isUpdatingRole: boolean;
  isRemoving: boolean;
  onRoleChange: (memberId: string, role: NetworkRole) => void;
  onRemoveMember: (memberId: string) => void;
};

function MemberRow({
  member,
  currentUserId,
  currentUserRole,
  isUpdatingRole,
  isRemoving,
  onRoleChange,
  onRemoveMember,
}: MemberRowProps) {
  const isSelf = member.userId === currentUserId;
  const editable = canEditRole(currentUserRole, member.role, isSelf);
  const removable = canRemoveMember(currentUserRole, member.role, isSelf);
  const options = editable ? getRoleOptions(currentUserRole, member.role) : [];

  return (
    <div className="flex min-h-14 items-center gap-3 px-3 py-2 transition hover:bg-muted/50">
      <Avatar size="default">
        {member.user.image && <AvatarImage src={member.user.image} />}
        <AvatarFallback>{getInitials(member.user.username)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {member.user.username}
        </p>
        {isSelf && <p className="text-xs text-muted-foreground">You</p>}
      </div>

      {editable ? (
        <SelectRoot
          value={member.role}
          disabled={isUpdatingRole}
          onValueChange={(value) =>
            onRoleChange(member.id, value as NetworkRole)
          }
        >
          <SelectTrigger
            size="sm"
            className={cn(
              ROLE_BADGES[member.role],
              "h-auto rounded-full border-transparent px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {ROLE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      ) : (
        <span className={badgeClasses(member.role)}>
          {ROLE_LABELS[member.role]}
        </span>
      )}

      {removable && (
        <button
          type="button"
          aria-label={`Remove ${member.user.username} from network`}
          disabled={isRemoving}
          onClick={() => onRemoveMember(member.id)}
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all outline-none select-none hover:bg-destructive/15 hover:text-destructive focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

export function MembersContent({
  networkId,
  currentUserRole,
}: {
  networkId: string;
  currentUserRole?: NetworkRole;
}) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [query, setQuery] = useState("");
  const { debouncedValue } = useDebounce(query, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["network-members", networkId, debouncedValue],
    queryFn: ({ signal }) => searchMembers(networkId, debouncedValue, signal),
    enabled: debouncedValue.trim().length > 0,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: NetworkRole }) =>
      updateMemberRole(networkId, memberId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["network-members", networkId],
      });
      toast.success("Member role updated.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      removeMemberFromNetwork(networkId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["network-members", networkId],
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Member removed.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const members = data?.members ? sortByRole(data.members) : [];

  return (
    <div className="mt-6 flex flex-1 flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members..."
          className="h-9 pl-9"
        />
      </div>

      {debouncedValue.trim().length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
          Search for a member by username.
        </div>
      ) : isLoading ? (
        <div className="overflow-hidden rounded-xl border">
          {Array.from({ length: 5 }).map((_, i) => (
            <MemberRowSkeleton key={i} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
          No members found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isUpdatingRole={
                updateRoleMutation.isPending &&
                updateRoleMutation.variables?.memberId === member.id
              }
              isRemoving={
                removeMemberMutation.isPending &&
                removeMemberMutation.variables === member.id
              }
              onRoleChange={(memberId, role) =>
                updateRoleMutation.mutate({ memberId, role })
              }
              onRemoveMember={(memberId) =>
                removeMemberMutation.mutate(memberId)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
