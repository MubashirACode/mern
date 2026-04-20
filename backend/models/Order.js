import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'services', required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  updates: [{
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const orderModel = mongoose.models.order || mongoose.model("order" , orderSchema)

export default orderModel;
