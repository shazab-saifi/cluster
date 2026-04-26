import express from "express";
import { mainRouter } from "../routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://cluster.shazab.site",
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());

app.use("/api", mainRouter);

app.listen(4000, () => console.log("Backend running on port 4000 ✅"));
