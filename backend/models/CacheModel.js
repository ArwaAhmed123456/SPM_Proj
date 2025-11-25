import mongoose from "mongoose";

const cacheSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  dataType: { type: String, required: true }, // 'npm_registry' or 'osv_vulnerabilities'
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // store any JSON data
}, {
  timestamps: true
});

// TTL index: automatically deletes documents older than 24 hours
//  Time To Live => TTL
cacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Cache = mongoose.model("Cache", cacheSchema);

export default Cache;
