import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        qty: { type: Number, required: true, min: 1 },
        rate: { type: Number, required: true, min: 0 },
        discountPercent: { type: Number, default: 0, min: 0, max: 100 },
        taxPercent: { type: Number, default: 0, min: 0 },
        hsnSac: { type: String, default: "" },
        taxAmount: { type: Number, default: 0 },
        unitCost: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 }
    },
    { _id: true }
);

const quotationSchema = new mongoose.Schema(
    {
        quotationNo: { type: String, required: true, unique: true, trim: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        date: { type: Date, required: true },
        validity: { type: Date, required: true },
        reference: { type: String, trim: true, default: "" },
        quotationType: {
            type: String,
            enum: ["Interstate", "Intrastate", "International"],
            default: "Intrastate"
        },
        items: { type: [quotationItemSchema], default: [] },
        subtotal: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        amountInWords: { type: String, default: "" },
        description: { type: String, default: "" },
        status: {
            type: String,
            enum: ["Pending", "Sent", "Ordered", "Converted"],
            default: "Pending"
        },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Unpaid", "Partially Paid"],
            default: "Unpaid"
        },
        paidAmount: { type: Number, default: 0 },
        convertedToSalesOrderId: { type: mongoose.Schema.Types.ObjectId, default: null }
    },
    { timestamps: true }
);

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
