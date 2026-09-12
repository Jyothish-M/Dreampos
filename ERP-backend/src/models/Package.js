import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    discountType: {
      type: String,
      enum: ["Fixed", "Percentage", "None"],
      default: "None",
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    position: {
      type: Number,
      default: 1,
    },
    trialDays: {
      type: Number,
      default: 0,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    modules: {
      type: [String],
      default: [],
    },
    maxCustomers: {
      type: Number,
      default: 0,
    },
    limitationsInvoices: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Package = mongoose.model("Package", packageSchema);
export default Package;
