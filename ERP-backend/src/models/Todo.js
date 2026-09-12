import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" }
}, { timestamps: true });

export default mongoose.model("Todo", todoSchema);
