import http from "http";
import { getSessionFromHeaders } from "@workspace/auth";
import { UnauthorizedError } from "@workspace/core/errors";
import { WebSocketServer } from "ws";

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", async (req, socket, head) => {
  try {
    socket.on("error", console.error);
    const session = await getSessionFromHeaders(req.headers);

    if (!session || !session.user || !session.session) {
      socket.destroy();
      throw new UnauthorizedError();
    }

    socket.removeListener("error", console.error);

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } catch (error) {
    console.error(error);
  }
});

wss.on("connection", async (ws) => {
  ws.on("error", console.error);

  ws.on("message", (message) => {
    console.log(message.toString());
    wss.clients.forEach((c) => {
      c.send(message.toString());
    });
  });
});

server.listen(8080, () => console.log("ws server running on port 8080"));
