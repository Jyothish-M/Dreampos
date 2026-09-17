import mongoose from "mongoose";

const expenseCategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("ExpenseCategory", expenseCategorySchema);