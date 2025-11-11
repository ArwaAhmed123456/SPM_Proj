import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dependencyRoutes from "./routes/dependencyRoute.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/dependencies", dependencyRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dependencyAgent";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.log("❌ MongoDB connection failed, starting server without DB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (without DB)`));
  });
