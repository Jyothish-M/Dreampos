import mongoose from "mongoose";

const currencySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    symbol: { type: String, required: true },
    rate: { type: String, default: "1" },
    status: { type: Boolean, default: true }
}, { timestamps: true });

const Currency = mongoose.model("Currency", currencySchema);
export default Currency;
