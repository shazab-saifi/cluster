export type NetworkRole = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
export type NetworkType = "PUBLIC" | "PRIVATE";

export type Network = {
  id: string;
  name: string;
  image: string | null;
  ownerId: string;
  type: NetworkType;
};

export type Channel = {
  id: string;
  name: string;
  networkId: string;
  createdAt: string;
  updatedAt: string;
};

export type Membership = {
  id: string;
  userId: string;
  networkId: string;
  role: NetworkRole;
  network?: Network;
};

export type MeResponse = {
  userData: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    networks: Network[];
    memberships: Membership[];
  };
};

export type DashboardUser = MeResponse["userData"];

export type FriendUser = Pick<
  DashboardUser,
  "id" | "name" | "username" | "image"
>;

export type Friendship = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  sender?: FriendUser;
  receiver?: FriendUser;
};

export type NetworkListItem = Network & {
  role: NetworkRole;
};

export type NetworkDetails = Network & {
  channels: Channel[];
};

export type MessageType = {
  type: "NEW_MESSAGE";
  id: string;
  channelId: string;
  message: string;
  sender: {
    id?: string;
    name: string;
    image: string | null;
  };
  createdAt?: Date;
  timestamp: Date | string;
  attachment?: string;
  edited?: boolean;
};

export type MessageRequestType =
  | "JOIN_CHANNEL"
  | "NEW_MESSAGE"
  | "EDIT_MESSAGE"
  | "DELETE_MESSAGE";

export type MessageErrorType = {
  type: "ERROR";
  requestType: MessageRequestType | "UNKNOWN";
  clientRequestId?: string;
  error: {
    code: string;
    message: string;
    timestamp: Date;
    createdAt?: Date;
    path: string;
    suggestion: string;
  };
};

type SuccessEvent = {
  type: "SUCCESS";
  requestType: MessageRequestType;
  clientRequestId?: string;
};

type EditMessageEvent = {
  type: "EDIT_MESSAGE";
  channelId: string;
  messageId: string;
  editedMessage: string;
};

type DeleteMessageEvent = {
  type: "DELETE_MESSAGE";
  channelId: string;
  messageId: string;
};

export type ServerEvent =
  | MessageType
  | SuccessEvent
  | MessageErrorType
  | EditMessageEvent
  | DeleteMessageEvent;
