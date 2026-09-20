import * as http from "http";
import { getSessionFromHeaders } from "@workspace/auth";
import {
  BadRequestError,
  buildErrorPayload,
  normalizeError,
  UnauthorizedError,
} from "@workspace/core/errors";
import { WebSocketServer, WebSocket } from "ws";
import { InputPayloadUnion } from "./zod.schemas";
import {
  assertHasFriendship,
  assertHasMembership,
} from "@workspace/core/services/validation";
import { publisher, subscriber } from "@workspace/redis";
import { NotificationEvent } from "@workspace/core/services/notification-services";
import { getMe } from "@workspace/core/services/me-services";
import * as messageServices from "@workspace/core/services/messages-services";

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

declare module "http" {
  interface IncomingMessage {
    userId?: string;
  }
}

server.on("upgrade", async (req, socket, head) => {
  try {
    const session = await getSessionFromHeaders(req.headers);

    if (!session || !session.session || !session.user) {
      throw new UnauthorizedError();
    }

    Object.assign(req, { userId: session.user.id });

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } catch (error) {
    const appError = normalizeError(error);
    const errorPayload = buildErrorPayload(appError);

    socket.write(
      `HTTP/1.1 ${appError.statusCode} ${appError.code}\r\n` +
        `Content-Type: text/plain\r\n` +
        `Connection: close\r\n` +
        `\r\n` +
        `WebSocket Upgrade Failed: ${JSON.stringify(errorPayload)}`
    );
    socket.destroy();
  }
});

const userSocketData = new WeakMap<
  WebSocket,
  { userId: string; rooms: Set<string> }
>();
const rooms = new Map<string, Set<WebSocket>>();
const subscribedRooms = new Set<string>();
const userNotificationSockets = new Map<string, Set<WebSocket>>();
let notificationEventsSubscribed = false;

function getRoomKey(kind: "channel" | "friendship", id: string) {
  return `${kind}:${id}`;
}

function getRoomTopic(roomKey: string) {
  return roomKey.slice(roomKey.indexOf(":") + 1);
}

type RequestType =
  | "JOIN_CHANNEL"
  | "JOIN_FRIENDSHIP"
  | "NEW_MESSAGE"
  | "EDIT_MESSAGE"
  | "DELETE_MESSAGE"
  | "UNKNOWN";

function sendSuccess(
  ws: WebSocket,
  requestType: Exclude<RequestType, "UNKNOWN">,
  clientRequestId?: string
) {
  ws.send(
    JSON.stringify({
      type: "SUCCESS",
      requestType,
      ...(clientRequestId ? { clientRequestId } : {}),
    })
  );
}

function sendError(
  ws: WebSocket,
  requestType: RequestType,
  clientRequestId: string | undefined,
  error: unknown
) {
  const errorPayload = buildErrorPayload(normalizeError(error));
  console.error(errorPayload);

  ws.send(
    JSON.stringify({
      type: "ERROR",
      requestType,
      ...(clientRequestId ? { clientRequestId } : {}),
      error: errorPayload,
    })
  );
}

wss.on("connection", async (ws, req) => {
  userSocketData.set(ws, { userId: req.userId as string, rooms: new Set() });
  registerSocketForNotifications(req.userId as string, ws);
  await subscribeToNotificationEvents();

  ws.on("error", (error) => console.error("Error in error event: ", error));

  ws.on("close", async () => {
    const socket = userSocketData.get(ws);
    if (!socket) return;

    unregisterSocketFromNotifications(socket.userId, ws);

    try {
      await Promise.all(
        [...socket.rooms].map((roomKey) => removeSocketFromRoom(roomKey, ws))
      );
    } catch (error) {
      console.error("Error in close event: ", error);
    }
  });

  ws.on("message", async (raw) => {
    let requestType: RequestType = "UNKNOWN";
    let clientRequestId: string | undefined;

    try {
      const rawPayload: unknown = JSON.parse(raw.toString());
      if (typeof rawPayload === "object" && rawPayload !== null) {
        const payload = rawPayload as Record<string, unknown>;
        if (typeof payload.type === "string") {
          requestType = [
            "JOIN_CHANNEL",
            "JOIN_FRIENDSHIP",
            "NEW_MESSAGE",
            "EDIT_MESSAGE",
            "DELETE_MESSAGE",
          ].includes(payload.type)
            ? (payload.type as Exclude<RequestType, "UNKNOWN">)
            : "UNKNOWN";
        }
        clientRequestId =
          typeof payload.clientRequestId === "string"
            ? payload.clientRequestId
            : undefined;
      }

      const parsed = InputPayloadUnion.safeParse(rawPayload);
      if (!parsed.success) {
        throw new BadRequestError(
          "Invalid Inputs",
          parsed.error.issues[0]?.message ??
            "Please make sure message follows the standard structure"
        );
      }

      const data = parsed.data;
      requestType = data.type;
      clientRequestId =
        data.type === "JOIN_CHANNEL" || data.type === "JOIN_FRIENDSHIP"
          ? undefined
          : data.clientRequestId;
      const userId = req.userId as string;
      const roomId =
        data.type === "JOIN_FRIENDSHIP" ? data.friendshipId : data.channelId;

      if (!roomId) {
        throw new BadRequestError(
          "Invalid Inputs",
          "Exactly one of channelId or friendshipId is required"
        );
      }

      switch (data.type) {
        case "JOIN_CHANNEL": {
          await joinRoom("channel", roomId, userId, ws);
          sendSuccess(ws, data.type);
          break;
        }
        case "JOIN_FRIENDSHIP": {
          await joinRoom("friendship", roomId, userId, ws);
          sendSuccess(ws, data.type);
          break;
        }
        case "NEW_MESSAGE": {
          const user = await getMe(userId);
          const timestamp = new Date().toISOString();
          const messageId = crypto.randomUUID();
          const target = data.channelId
            ? { channelId: data.channelId }
            : { friendshipId: data.friendshipId };
          const messagePayloadForPublisher = {
            type: "NEW_MESSAGE" as const,
            id: messageId,
            ...target,
            message: data.message,
            sender: {
              id: userId,
              name: user.name ?? "",
              image: user.image,
            },
            timestamp,
            ...(data.attachment !== undefined
              ? { attachment: data.attachment }
              : {}),
          };
          const messagePayloadForStream = {
            type: "NEW_MESSAGE" as const,
            messageId,
            senderId: userId,
            ...target,
            timestamp,
            message: data.message,
            ...(data.attachment !== undefined
              ? { attachment: data.attachment }
              : {}),
          };

          await messageServices.newMsgEvent(messagePayloadForStream);
          await publisher.publish(
            roomId,
            JSON.stringify(messagePayloadForPublisher)
          );
          sendSuccess(ws, data.type, clientRequestId);
          break;
        }
        case "EDIT_MESSAGE": {
          const target = data.channelId
            ? { channelId: data.channelId }
            : { friendshipId: data.friendshipId };
          await messageServices.editMsgEvent({
            type: "EDIT_MESSAGE",
            messageId: data.messageId,
            senderId: userId,
            ...target,
            editedMessage: data.editedMessage,
          });
          await publisher.publish(
            roomId,
            JSON.stringify({
              type: "EDIT_MESSAGE",
              ...target,
              messageId: data.messageId,
              editedMessage: data.editedMessage,
            })
          );
          sendSuccess(ws, data.type, clientRequestId);
          break;
        }
        case "DELETE_MESSAGE": {
          const target = data.channelId
            ? { channelId: data.channelId }
            : { friendshipId: data.friendshipId };
          await messageServices.deleteMsgEvent({
            type: "DELETE_MESSAGE",
            messageId: data.messageId,
            senderId: userId,
            ...target,
          });
          await publisher.publish(
            roomId,
            JSON.stringify({
              type: "DELETE_MESSAGE",
              ...target,
              messageId: data.messageId,
            })
          );
          sendSuccess(ws, data.type, clientRequestId);
          break;
        }
        default:
          throw new BadRequestError("Invalid type", "Unsupported message type");
      }
    } catch (error) {
      sendError(ws, requestType, clientRequestId, error);
    }
  });
});

server.listen(8080, () => {
  console.log("ws-server is running on port 8080");
});

async function joinRoom(
  kind: "channel" | "friendship",
  roomId: string,
  userId: string,
  ws: WebSocket
) {
  if (kind === "channel") {
    await assertHasMembership(roomId, userId);
  } else {
    await assertHasFriendship(roomId, userId);
  }

  const roomKey = getRoomKey(kind, roomId);
  if (!rooms.has(roomKey)) {
    rooms.set(roomKey, new Set());
    await subscribeToRoom(roomKey);
  }

  if (rooms.get(roomKey)?.has(ws)) return;

  rooms.get(roomKey)?.add(ws);
  userSocketData.get(ws)?.rooms.add(roomKey);
}

async function subscribeToRoom(roomKey: string) {
  if (subscribedRooms.has(roomKey)) return;

  const topic = getRoomTopic(roomKey);
  await subscriber.subscribe(topic, (data) => {
    const room = rooms.get(roomKey);
    if (!room) return;
    for (const ws of room) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  });

  subscribedRooms.add(roomKey);
}

async function removeSocketFromRoom(roomKey: string, ws: WebSocket) {
  const room = rooms.get(roomKey);

  if (!room) return;

  room.delete(ws);

  if (room.size > 0) return;
  rooms.delete(roomKey);
  await unsubscribeRoom(roomKey);
}

async function unsubscribeRoom(roomKey: string) {
  if (!subscribedRooms.has(roomKey)) return;

  await subscriber.unsubscribe(getRoomTopic(roomKey));
  subscribedRooms.delete(roomKey);
}

async function subscribeToNotificationEvents() {
  if (notificationEventsSubscribed) return;

  await subscriber.subscribe("persisted-notification-events", (data) => {
    let events: NotificationEvent | NotificationEvent[];

    try {
      events = JSON.parse(data);
    } catch {
      return;
    }

    for (const notification of Array.isArray(events) ? events : [events]) {
      if (!notification?.userId || !notification.type) continue;

      const sockets = userNotificationSockets.get(notification.userId);
      if (!sockets) continue;

      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
        }
      }
    }
  });

  notificationEventsSubscribed = true;
}

function registerSocketForNotifications(userId: string, ws: WebSocket) {
  if (!userNotificationSockets.has(userId)) {
    userNotificationSockets.set(userId, new Set());
  }
  userNotificationSockets.get(userId)?.add(ws);
}

function unregisterSocketFromNotifications(userId: string, ws: WebSocket) {
  const sockets = userNotificationSockets.get(userId);
  if (!sockets) return;

  sockets.delete(ws);
  if (sockets.size === 0) {
    userNotificationSockets.delete(userId);
  }
}
