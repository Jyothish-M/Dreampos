import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: false, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true }, 
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    gstin: { type: String, unique: true, sparse: true },
    avatar: String,
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
