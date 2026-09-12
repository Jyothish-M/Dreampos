import mongoose from "mongoose";

const taxSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["GST", "VAT", "CGST", "SGST", "IGST"], default: "GST" },
    rate: { type: Number, required: true, min: 0 },
    status: { type: Boolean, default: true }
}, { timestamps: true });

const Tax = mongoose.model("Tax", taxSchema);
export default Tax;
