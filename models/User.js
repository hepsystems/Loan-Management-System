const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  // Password reset (forgot password) — token itself is never stored, only its hash
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // never expose the hash to the client
    delete ret.resetPasswordTokenHash;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
