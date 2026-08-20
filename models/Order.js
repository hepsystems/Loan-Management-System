const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // uuid, kept for frontend compatibility
  productId: { type: Number, required: true },
  productName: { type: String, default: '' },
  quantity: { type: mongoose.Schema.Types.Mixed, default: 1 },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true },
  customerPhone: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, default: 'pending' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', orderSchema);
