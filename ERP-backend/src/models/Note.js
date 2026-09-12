import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  color: { type: String, default: "#ffffff" },
  isPinned: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Note", noteSchema);
