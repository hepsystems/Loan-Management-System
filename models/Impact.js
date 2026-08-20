const mongoose = require('mongoose');

const impactSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true },
  meta: { type: String, trim: true, default: '' },
  color: { type: String, default: '#4a7c59' }
}, { timestamps: true });

impactSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Impact', impactSchema);
