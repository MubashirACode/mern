import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }
}, { timestamps: true });

const servicesModel = mongoose.models.services || mongoose.model("services" , serviceSchema)

export default servicesModel;
