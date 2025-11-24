import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  userId:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  action:
    { type: String, required: true },
  resource: String,
  resourceId: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  diff: mongoose.Schema.Types.Mixed, // shallow diff of changes
  meta: mongoose.Schema.Types.Mixed, // optional extra metadata
  ipAddress: String,
  userAgent: String,
  timestamp:
    { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);
