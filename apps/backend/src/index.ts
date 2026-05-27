import express from "express";
import { mainRouter } from "routes/main";
import { toNodeHandler } from "@workspace/auth";
import { auth } from "@workspace/auth";
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
app.use("/", mainRouter);

app.listen(4000, () => console.log("Backend running on port 4000 ✅"));
