import mongoose from "mongoose";

const sellingTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

const SellingType = mongoose.model("SellingType", sellingTypeSchema);
export default SellingType;
