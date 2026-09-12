import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { type: String },
  location: { type: String },
  rating: { type: Number, default: 0 },
  avatar: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);
