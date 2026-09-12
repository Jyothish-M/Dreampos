import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  clientName: { type: String },
  budget: { type: Number, default: 0 },
  dueDate: { type: Date },
  status: { type: String, enum: ["Pending", "In Progress", "Completed", "On Hold"], default: "Pending" },
  progress: { type: Number, default: 0 },
  tasksTotal: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
