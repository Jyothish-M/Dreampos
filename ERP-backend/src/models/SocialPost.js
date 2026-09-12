import mongoose from "mongoose";

const socialPostSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userHandle: { type: String, required: true },
  userImage: { type: String },
  location: { type: String },
  timestamp: { type: String },
  content: { type: String, required: true },
  image: { type: String },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("SocialPost", socialPostSchema);
