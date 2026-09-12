import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    phone: { type: String, unique: true, sparse: true }, 
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    taxId: { type: String, sparse: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
