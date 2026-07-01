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
import { publisher, redisClient, subscriber } from "@workspace/redis";
import { NotificationType } from "@workspace/core/services/notification-services";
import { getMe } from "@workspace/core/services/me-services";

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
    try {
      const { success, error, data } = InputPayloadUnion.safeParse(
        JSON.parse(raw.toString())
      );

      if (!success) {
        throw new BadRequestError(
          "Invalid Inputs",
          error.issues[0]?.message ??
            "Please make sure message follows the standard structure"
        );
      }

      const channelId = data.channelId;

      switch (data.type) {
        case "JOIN_CHANNEL": {
          await joinChannel(channelId, req.userId as string, ws);

          ws.send(
            JSON.stringify({
              type: "SUCCESS",
              message: "Successfully joined channel",
            })
          );
          break;
        }
        case "NEW_MESSAGE": {
          const userId = req.userId as string;
          const user = await getMe(userId);
          const timestamp = new Date().toISOString();

          const messagePayloadForPublisher = {
            type: "NEW_MESSAGE",
            channelId,
            message: data.message,
            sender: {
              id: userId,
              name: user.name,
              avatar: user.image,
            },
            timestamp,
          };

          if (data.attachment !== undefined) {
            (
              messagePayloadForPublisher as { attachment?: unknown }
            ).attachment = data.attachment;
          }

          await publisher.publish(
            `${channelId}`,
            JSON.stringify(messagePayloadForPublisher)
          );

          const messagePayloadForStream = {
            channelId,
            message: data.message,
            senderId: userId,
            timestamp,
          };

          if (data.attachment !== undefined) {
            (messagePayloadForStream as { attachment?: unknown }).attachment =
              data.attachment;
          }

          await redisClient.xAdd("chat-stream", "*", messagePayloadForStream, {
            TRIM: {
              strategy: "MAXLEN",
              strategyModifier: "~",
              threshold: 10000,
            },
          });
          break;
        }
        default: {
          const appError = normalizeError(
            new BadRequestError(
              "Invalid type",
              "Please make sure type is valid"
            )
          );
          const errorPayload = buildErrorPayload(appError);
          ws.send(JSON.stringify({ type: "ERROR", error: errorPayload }));
          break;
        }
      }
    } catch (error) {
      const appError = normalizeError(error);
      const errorPayload = buildErrorPayload(appError);

      ws.send(JSON.stringify({ type: "ERROR", error: errorPayload }));
    }
  });
});

server.listen(8080, () => {
  console.log("ws server running on port 8080");
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
  await subscriber.subscribe("notification", (data) => {
    const notification: NotificationType = JSON.parse(data);
    const isRecevier = userSocketData.get(ws);
    if (isRecevier?.userId === notification.receiverId) {
      ws.send(String(notification));
    }
  });
}
