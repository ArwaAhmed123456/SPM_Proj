import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dependencyRoutes from "./routes/dependencyRoute.js";
import {
  validateHandshakeMessage,
  processTaskAssignment,
} from "./services/taskProcessor.js";
import morgan from "morgan";

dotenv.config();
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Add HTTP request logger middleware to aid debugging
app.use(morgan("dev"));

app.use("/api/dependencies", dependencyRoutes);

// Base64 decode utility function with improved error handling
const decodeBase64 = (base64Str) => {
  try {
    return Buffer.from(base64Str, "base64");
  } catch (err) {
    throw new Error("Invalid base64 string");
  }
};

// Updated /execute-dependency route for dependency analysis (package.json, requirements.txt)
app.post("/execute-dependency", async (req, res) => {
  try {
    const message = req.body;

    // Strict validation for required fields
    if (
      !message ||
      typeof message !== "object" ||
      !message.message_id ||
      !message.sender ||
      !message.recipient ||
      !message.type ||
      !message.task ||
      typeof message.task !== "object"
    ) {
      return res.status(400).json({
        status: "failed",
        result: { error: "Invalid message format: missing required fields or task" },
      });
    }

    if (message.recipient !== "dependency_health_agent") {
      return res.status(400).json({
        status: "failed",
        result: { error: "Wrong recipient: message not for this agent" },
      });
    }

    const { file_content_base64, file_type, project_name } = message.task;

    if (
      !file_content_base64 ||
      typeof file_content_base64 !== "string" ||
      !file_type ||
      typeof file_type !== "string"
    ) {
      return res.status(400).json({
        status: "failed",
        result: { error: "Invalid task format: missing or incorrect file content or file type" },
      });
    }

    let dependencies = {};

    if (file_type === "package.json") {
      // Decode base64 content and parse package.json
      let fileContentStr;
      try {
        fileContentStr = decodeBase64(file_content_base64).toString("utf-8");
      } catch (e) {
        return res.status(400).json({
          status: "failed",
          result: { error: "Invalid base64 in file content" },
        });
      }

      try {
        const pkgJson = JSON.parse(fileContentStr);
        dependencies = pkgJson.dependencies || {};
      } catch (e) {
        return res.status(400).json({
          status: "failed",
          result: { error: "Invalid JSON in package.json" },
        });
      }
    } else if (file_type === "requirements.txt") {
      // Decode base64 and parse requirements.txt
      let fileContentStr;
      try {
        fileContentStr = decodeBase64(file_content_base64).toString("utf-8");
      } catch (e) {
        return res.status(400).json({
          status: "failed",
          result: { error: "Invalid base64 in file content" },
        });
      }

      dependencies = {};
      const lines = fileContentStr.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) continue;
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

    // Defensive check: ensure dependencies is an object
    if (!dependencies || typeof dependencies !== "object") {
      dependencies = {};
    }

    // Call analyzeDependencies from dependencyRoutes with proper async/await
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

    try {
      const analyzeLayer = dependencyRoutes.stack.find(
        (layer) => layer.route?.path === "/analyze"
      );
      if (!analyzeLayer) {
        return res.status(500).json({
          status: "failed",
          result: { error: "Analysis route not found" },
        });
      }
      await analyzeLayer.route.stack[0].handle(mockReq, mockRes);
    } catch (e) {
      console.error("Error calling analyzeDependencies route:", e);
      return res.status(500).json({
        status: "failed",
        result: { error: "Internal error during dependency analysis" },
      });
    }

    // Calculate total dependencies and overall health score from analysisResult
    const totalDependencies = Array.isArray(analysisResult) ? analysisResult.length : 0;
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
    console.error("Error in /execute route:", error);
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
    console.error("❌ MongoDB connection failed, starting server without DB", err);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (without DB)`));
  });
