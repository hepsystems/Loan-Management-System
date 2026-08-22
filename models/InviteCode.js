const mongoose = require('mongoose');

// Admin-generated codes that must be supplied at registration time.
// This is the "front door lock" — it keeps random / unwanted people from
// self-registering; only someone who was handed a valid code by an admin
// can create a member account.
const inviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, trim: true, default: '' }, // optional label, e.g. "For March intake"
  maxUses: { type: Number, default: 1, min: 1 },
  usesCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, default: null }, // null = never expires
  revoked: { type: Boolean, default: false }
}, { timestamps: true });

inviteCodeSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('InviteCode', inviteCodeSchema);
