import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["Incoming", "Outgoing", "Missed"], required: true },
  duration: { type: String, default: "0m 0s" },
  status: { type: String, enum: ["Answered", "Missed", "Busy"], default: "Answered" },
  avatar: { type: String }
}, { timestamps: true });

export default mongoose.model("CallLog", callLogSchema);
