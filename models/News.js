const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  excerpt: { type: String, required: true, trim: true },
  date: { type: String, trim: true }
}, { timestamps: true });

newsSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('News', newsSchema);
