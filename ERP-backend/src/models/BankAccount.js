import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema({
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    ifsc: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const BankAccount = mongoose.model("BankAccount", bankAccountSchema);
export default BankAccount;
