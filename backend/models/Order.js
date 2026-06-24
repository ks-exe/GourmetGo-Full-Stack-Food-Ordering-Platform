const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: String, default: "Gulberg III, Lahore" }, // Hardcoded for this project demo
  status: { type: String, enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
