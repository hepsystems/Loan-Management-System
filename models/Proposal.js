const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // uuid
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  org: { type: String, trim: true, default: '' },
  purpose: { type: String, required: true, trim: true },
  status: { type: String, default: 'pending' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

proposalSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Proposal', proposalSchema);
