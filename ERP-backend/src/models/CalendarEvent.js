import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String },
  type: { type: String, enum: ["Event", "Meeting", "Reminder", "Task"], default: "Event" },
  description: { type: String },
  location: { type: String }
}, { timestamps: true });

export default mongoose.model("CalendarEvent", calendarEventSchema);
