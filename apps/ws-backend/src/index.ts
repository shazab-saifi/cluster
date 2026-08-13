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
import { assertHasMembership } from "@workspace/core/services/validation";
import { publisher, subscriber } from "@workspace/redis";
import { NotificationType } from "@workspace/core/services/notification-services";
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
  { userId: string; channels: Set<string> }
>();
const channels = new Map<string, Set<WebSocket>>();
const subscribedChannels = new Set<string>();

type RequestType =
  | "JOIN_CHANNEL"
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
  userSocketData.set(ws, { userId: req.userId as string, channels: new Set() });
  await subscribeToNotification(ws);

  ws.on("error", (error) => console.error("Error in error event: ", error));

  ws.on("close", async () => {
    const socket = userSocketData.get(ws);
    if (!socket) return;

    try {
      await Promise.all(
        [...socket.channels].map((channelId) =>
          removeSocketFromChannel(channelId, ws)
        )
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
        data.type === "JOIN_CHANNEL" ? undefined : data.clientRequestId;
      const userId = req.userId as string;
      const channelId = data.channelId;

      switch (data.type) {
        case "JOIN_CHANNEL": {
          await joinChannel(channelId, userId, ws);
          sendSuccess(ws, data.type);
          break;
        }
        case "NEW_MESSAGE": {
          const user = await getMe(userId);
          const timestamp = new Date().toISOString();
          const messageId = crypto.randomUUID();
          const messagePayloadForPublisher = {
            type: "NEW_MESSAGE" as const,
            id: messageId,
            channelId,
            message: data.message,
            sender: {
              id: userId,
              name: user.name,
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
            channelId,
            timestamp,
            message: data.message,
            ...(data.attachment !== undefined
              ? { attachment: data.attachment }
              : {}),
          };

          await messageServices.newMsgEvent(messagePayloadForStream);
          await publisher.publish(
            channelId,
            JSON.stringify(messagePayloadForPublisher)
          );
          sendSuccess(ws, data.type, clientRequestId);
          break;
        }
        case "EDIT_MESSAGE": {
          await messageServices.editMsgEvent({
            type: "EDIT_MESSAGE",
            messageId: data.messageId,
            senderId: userId,
            channelId,
            editedMessage: data.editedMessage,
          });
          await publisher.publish(
            channelId,
            JSON.stringify({
              type: "EDIT_MESSAGE",
              channelId,
              messageId: data.messageId,
              editedMessage: data.editedMessage,
            })
          );
          sendSuccess(ws, data.type, clientRequestId);
          break;
        }
        case "DELETE_MESSAGE": {
          await messageServices.deleteMsgEvent({
            type: "DELETE_MESSAGE",
            messageId: data.messageId,
            senderId: userId,
            channelId,
          });
          await publisher.publish(
            channelId,
            JSON.stringify({
              type: "DELETE_MESSAGE",
              channelId,
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

async function joinChannel(channelId: string, userId: string, ws: WebSocket) {
  await assertHasMembership(channelId, userId);
  if (!channels.has(channelId)) {
    channels.set(channelId, new Set());
    await subscribeToPublishers(channelId);
  }

  if (channels.get(channelId)?.has(ws)) return;

  channels.get(channelId)?.add(ws);
  userSocketData.get(ws)?.channels.add(channelId);
}

async function subscribeToPublishers(channelId: string) {
  if (subscribedChannels.has(channelId)) return;

  await subscriber.subscribe(`${channelId}`, (data) => {
    const channel = channels.get(channelId);
    if (!channel) return;
    for (const ws of channel) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  });

  subscribedChannels.add(channelId);
}

async function removeSocketFromChannel(channelId: string, ws: WebSocket) {
  const channel = channels.get(channelId);

  if (!channel) return;

  channel.delete(ws);

  if (channel.size > 0) return;
  channels.delete(channelId);
  await unsubscribeChannel(channelId);
}

async function unsubscribeChannel(channelId: string) {
  if (!subscribedChannels.has(channelId)) return;

  await subscriber.unsubscribe(channelId);
  subscribedChannels.delete(channelId);
}

async function subscribeToNotification(ws: WebSocket) {
  await subscriber.subscribe("persisted-notification-event", (data) => {
    const notification: NotificationType = JSON.parse(data);
    const isRecevier = userSocketData.get(ws);

    if (isRecevier?.userId === notification.receiverId) {
      ws.send(JSON.stringify(notification));
    }
  });
}
