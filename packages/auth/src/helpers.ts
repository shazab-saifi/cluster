import { IncomingHttpHeaders } from "node:http";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";

export async function getSessionFromHeaders(headers: IncomingHttpHeaders) {
  return await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });
}
