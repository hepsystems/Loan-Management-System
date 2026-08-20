const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // uuid
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  subject: { type: String, trim: true, default: 'General enquiry' },
  message: { type: String, required: true, trim: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

contactSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Contact', contactSchema);
