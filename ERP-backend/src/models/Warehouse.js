import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    avatar: String
}, { timestamps: true });

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export default Warehouse;
