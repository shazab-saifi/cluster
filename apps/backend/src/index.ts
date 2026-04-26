import express from "express";
import { mainRouter } from "../routes";

const app = express();
app.use(express.json());

app.use("/api", mainRouter);

app.listen(4000, () => console.log("Backend running on port 4000 ✅"));
