import express from "express";
import config from "./config.js";
import cors from "cors";
import merkleVisualizationRouter from "./api/watcherApiMerkle.js";
import pinataVisualizationRouter from "./api/watcherApiPinata.js";
import { prisma } from "./prisma/client.js";

export const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/merkle", merkleVisualizationRouter);
app.use("/api/pinata", pinataVisualizationRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Pour wake up la db
app.get("/api/warmup", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "warm", message: "Base de donnee reveiller." });
});

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);
