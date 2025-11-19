import mongoose from 'mongoose';

const revokedTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    // index created below for TTL; avoid duplicate index declaration here
  }
}, { timestamps: true });

// TTL index to remove expired revoked tokens automatically
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RevokedToken', revokedTokenSchema);
