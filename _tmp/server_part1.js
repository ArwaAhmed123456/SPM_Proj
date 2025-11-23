import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dependencyRoutes from "./routes/dependencyRoute.js";
import { unzip } from "zlib";
import { promisify } from "util";

dotenv.config();
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.use("/api/dependencies", dependencyRoutes);

// Simple health check endpoint for monitoring
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
