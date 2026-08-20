const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // numeric id kept for frontend compatibility
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true }
}, { timestamps: true });

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);
