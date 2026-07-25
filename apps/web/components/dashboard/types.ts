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
};

type MessageErrorType = {
  type: "ERROR";
  error: {
    code: string;
    message: string;
    timestamp: Date;
    createdAt?: Date;
    path: string;
    suggestion: string;
  };
};

type NewMessageEvent = MessageType;

type EditMessageResult = {
  type: "EDIT_MESSAGE";
  status: "Success" | "FAILED";
  senderId: string;
  messageId: string;
  error?: MessageErrorType["error"];
};

type DeleteMessageResult = {
  type: "DELETE_MESSAGE";
  status: "Success" | "FAILED";
  senderId: string;
  messageId: string;
  error?: MessageErrorType["error"];
};

export type ServerEvent =
  | NewMessageEvent
  | MessageErrorType
  | EditMessageResult
  | DeleteMessageResult;
