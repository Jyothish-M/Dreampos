import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    reference: { type: String, unique: true },
    store: { type: String, required: true },
    category: { type: String, required: true },
    notes: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

// Auto-generate reference like IN849
incomeSchema.pre("save", function (next) {
  if (!this.reference) {
    this.reference = "IN" + Math.floor(100 + Math.random() * 900);
  }
  next();
});

export default mongoose.model("Income", incomeSchema);
