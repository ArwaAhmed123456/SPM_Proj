import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dependencyRoutes from "./routes/dependencyRoute.js";
import {
  validateHandshakeMessage,
  processTaskAssignment,
} from "./services/taskProcessor.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/dependencies", dependencyRoutes);

// Existing /execute route for dependency analysis (package.json, requirements.txt)
app.post("/execute-dependency", async (req, res) => {
  try {
    const message = req.body;

    // Basic validation for required fields
    if (
      !message.message_id ||
      !message.sender ||
      !message.recipient ||
      !message.type ||
      !message.task
    ) {
      return res.status(400).json({
        status: "failed",
        result: { error: "Invalid message format: missing required fields" },
      });
    }

    if (message.recipient !== "dependency_health_agent") {
      return res.status(400).json({
        status: "failed",
        result: { error: "Wrong recipient: message not for this agent" },
      });
    }

    const { file_content_base64, file_type, project_name } = message.task;

    if (!file_content_base64 || !file_type) {
      return res.status(400).json({
        status: "failed",
        result: { error: "Invalid task format: missing file content or file type" },
      });
    }

    // Decode base64 content
    let fileContentStr;
    try {
      fileContentStr = Buffer.from(file_content_base64, "base64").toString("utf-8");
    } catch (e) {
      return res.status(400).json({
        status: "failed",
        result: { error: "Invalid base64 in file content" },
      });
    }

    let dependencies = {};

    if (file_type === "package.json") {
      // Parse JSON content
      let pkgJson;
      try {
        pkgJson = JSON.parse(fileContentStr);
      } catch (e) {
        return res.status(400).json({
          status: "failed",
          result: { error: "Invalid JSON in package.json" },
        });
      }

      dependencies = pkgJson.dependencies || {};
    } else if (file_type === "requirements.txt") {
      // Parse requirements.txt - each line package==version or package>=version
      dependencies = {};
      const lines = fileContentStr.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) continue;
        // Regex to parse package and version specifiers (simplified)
        const match = trimmed.match(/^([a-zA-Z0-9_-]+)([=><!~^]+)?(.+)?$/);
        if (match) {
          const pkg = match[1];
          const ver = match[3] ? match[3].trim() : "";
          dependencies[pkg] = ver || "unknown";
        }
      }
    } else {
      return res.status(400).json({
        status: "failed",
        result: { error: `Unsupported file type: ${file_type}` },
      });
    }

    // Call analyzeDependencies logic from dependencyRoutes
    // Simulate req and res objects for calling analyzeDependencies
    const mockReq = { body: { dependencies } };
    let analysisResult;
    const mockRes = {
      status: (code) => ({
        json: (obj) => {
          analysisResult = obj;
          return obj;
        },
      }),
      json: (obj) => {
        analysisResult = obj;
        return obj;
      },
    };

    // Note: analyzeDependencies is an async function exported from dependencyRoute.js
    await dependencyRoutes.stack
      .find((layer) => layer.route?.path === "/")
      .route.stack[0].handle(mockReq, mockRes);

    // Calculate total dependencies and overall health score
    const totalDependencies = analysisResult.length || 0;
    const overallHealthScore = totalDependencies
      ? Math.round(
          analysisResult.reduce((acc, dep) => acc + (dep.healthScore || 0), 0) /
            totalDependencies
        )
      : 0;

    res.status(200).json({
      message_id: `response-${Date.now()}`,
      sender: "dependency_health_agent",
      recipient: message.sender,
      type: "task_response",
      related_message_id: message.message_id,
      status: "completed",
      result: {
        project_name: project_name || "Unknown Project",
        file_type,
        total_dependencies: totalDependencies,
        overall_health_score: overallHealthScore,
        dependencies: analysisResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in /execute-dependency route:", err);
    res.status(500).json({
      status: "failed",
      result: { error: "Internal server error" },
    });
  }
});

// New /execute route for handshake message validation and task processing
app.post("/execute", async (req, res) => {
  const message = req.body;

  if (!validateHandshakeMessage(message)) {
    return res.status(400).json({
      status: "failed",
      result: { error: "Invalid handshake message" },
    });
  }

  try {
    const result = await processTaskAssignment(message["results/task"]);

    return res.status(200).json({
      message_id: `response-${Date.now()}`,
      sender: "dependency_health_agent",
      recipient: message.sender,
      type: "task_response",
      related_message_id: message.message_id,
      status: result.status,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ status: "failed", result: { error: error.message } });
  }
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dependencyAgent";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed, starting server without DB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (without DB)`));
  });
