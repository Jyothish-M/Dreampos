import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String },
  lastMessage: { type: String },
  time: { type: String },
  unreadCount: { type: Number, default: 0 },
  status: { type: String, enum: ["Online", "Offline", "Away"], default: "Offline" },
  messages: [{
    sender: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: String, required: true }
  }]
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);
