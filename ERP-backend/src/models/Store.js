import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, default: "" },
    plan: { type: String, default: "Basic" },
    planType: { type: String, default: "Monthly" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    gstin: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    website: { type: String, default: "" },
    password: { type: String, default: "" },
    currency: { type: String, default: "" },
    language: { type: String, default: "" }
}, { timestamps: true });

const Store = mongoose.model("Store", storeSchema);
export default Store;
