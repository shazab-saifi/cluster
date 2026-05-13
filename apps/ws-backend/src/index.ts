import http from "http";
import { getSessionFromHeaders } from "@workspace/auth";
import { WebSocketServer, WebSocket } from "ws";
import {
  BadRequestError,
  buildErrorPayload,
  normalizeError,
  NotFoundError,
  UnauthorizedError,
} from "@workspace/core/errors";
import { assertHasMembership } from "@workspace/core/services/validation";
import { InputPayloadUnion } from "./zod.schemas";
import { publisher, subscriber } from "@workspace/redis";

type AuthenticatedRequest = http.IncomingMessage & {
  userId: string;
};

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

function rejectUpgrade(
  socket: Pick<NodeJS.WritableStream, "end">,
  statusCode: number,
  statusText: string
) {
  socket.end(
    [`HTTP/1.1 ${statusCode} ${statusText}`, "Connection: close", "", ""].join(
      "\r\n"
    )
  );
}

server.on("upgrade", async (req, socket, head) => {
  try {
    const session = await getSessionFromHeaders(req.headers);

    if (!session?.user || !session?.session) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.userId = session.user.id;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, authenticatedReq);
    });
  } catch (error) {
    const appError = normalizeError(error);
    console.error("websocket upgrade failed", appError);

    if (appError instanceof UnauthorizedError || appError.statusCode === 401) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    rejectUpgrade(socket, 500, "Internal Server Error");
  }
});

type SocketData = {
  userId: string;
  channels: Set<string>;
};

const socketData = new WeakMap<WebSocket, SocketData>();
const channelsSockets = new Map<string, Set<WebSocket>>();
const subscribedChannels = new Set<string>();

async function joinChannel(ws: WebSocket, channelId: string) {
  const socket = socketData.get(ws);

  if (!socket) {
    throw new BadRequestError("Socket is not initialized");
  }

  await assertHasMembership(channelId, socket.userId);

  if (socket.channels.has(channelId)) {
    throw new BadRequestError("You're already part of this channel");
  }

  if (!channelsSockets.get(channelId)) {
    channelsSockets.set(channelId, new Set());
    await subscribeToPublisher(channelId);
  }

  channelsSockets.get(channelId)?.add(ws);
  socket.channels.add(channelId);
}

async function subscribeToPublisher(channelId: string) {
  if (subscribedChannels.has(channelId)) return;

  await subscriber.subscribe(`${channelId}`, (data) => {
    const socket = channelsSockets.get(channelId);
    if (!socket) return;
    for (const ws of socket) {
      ws.send(data);
    }
  });

  subscribedChannels.add(channelId);
}

async function unsubscribeFromPublisher(channelId: string) {
  if (!subscribedChannels.has(channelId)) return;

  await subscriber.unsubscribe(`${channelId}`);
  subscribedChannels.delete(channelId);
}

async function removeSocketFromChannel(ws: WebSocket, channelId: string) {
  const sockets = channelsSockets.get(channelId);

  if (!sockets) {
    return;
  }

  sockets.delete(ws);

  if (sockets.size > 0) {
    return;
  }

  channelsSockets.delete(channelId);
  await unsubscribeFromPublisher(channelId);
}

function publishMessage(channelId: string, ws: WebSocket, data: unknown) {
  const socket = channelsSockets.get(channelId);

  if (!socket) {
    throw new NotFoundError("Channel not found");
  }

  if (socket.has(ws)) {
    publisher.publish(`${channelId}`, JSON.stringify(data));
  } else {
    throw new BadRequestError("You need to first join this channel.");
  }
}

wss.on("connection", async (ws, req) => {
  const userId = (req as AuthenticatedRequest).userId;
  socketData.set(ws, {
    userId,
    channels: new Set(),
  });

  ws.on("error", console.error);

  ws.on("close", async () => {
    const socket = socketData.get(ws);

    if (!socket) {
      return;
    }

    try {
      await Promise.all(
        [...socket.channels].map((channelId) =>
          removeSocketFromChannel(ws, channelId)
        )
      );
    } catch (error) {
      console.error("websocket close cleanup failed", error);
    }

    socketData.delete(ws);
  });

  ws.on("message", async (raw) => {
    try {
      const request = JSON.parse(raw.toString());
      const { success, error, data } = InputPayloadUnion.safeParse(request);

      if (!success) {
        throw new BadRequestError("Invalid Inputs", error.issues[0]?.message);
      }

      const channelId = data?.payload.channelId;

      switch (data.type) {
        case "JOIN_CHANNEL":
          await joinChannel(ws, channelId);

          ws.send(
            JSON.stringify({
              status: "success",
              msg: "Joined Channel Successfully",
            })
          );
          break;
        case "SEND_MESSAGE":
          publishMessage(channelId, ws, data.payload.content);
          break;
        default:
          throw new BadRequestError();
      }
    } catch (error) {
      const appError = normalizeError(error);

      ws.send(
        JSON.stringify({
          type: "error",
          error: buildErrorPayload(appError, "/ws/message"),
        })
      );
    }
  });
});

server.listen(8080, () => console.log("ws server running on port 8080"));
