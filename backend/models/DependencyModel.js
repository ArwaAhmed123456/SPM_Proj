import mongoose from "mongoose";

const dependencySchema = new mongoose.Schema({
  name: String,
  version: String,
  latestVersion: String,
  vulnerabilities: Number,
  healthScore: Number,
  riskLevel: String,
}, { timestamps: true });

export default mongoose.model("Dependency", dependencySchema);
