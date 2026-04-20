import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' }
}, { timestamps: true });

const messageModel = mongoose.models.message || mongoose.model("message" , messageSchema)

export default messageModel;
