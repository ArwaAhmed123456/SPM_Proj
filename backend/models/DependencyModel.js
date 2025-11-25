
import mongoose from "mongoose";

// adding time stamp for long-term memory record
const dependencySchema = new mongoose.Schema({
  name: String,
  version: String,
  latestVersion: String,
  vulnerabilities: Number,
  healthScore: Number,
  riskLevel: String,
}, { timestamps: true });  

const Dependency = mongoose.model("Dependency", dependencySchema);

export default Dependency;
