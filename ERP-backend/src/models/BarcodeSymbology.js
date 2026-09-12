import mongoose from "mongoose";

const barcodeSymbologySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

const BarcodeSymbology = mongoose.model("BarcodeSymbology", barcodeSymbologySchema);
export default BarcodeSymbology;
