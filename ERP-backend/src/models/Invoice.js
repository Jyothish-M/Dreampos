import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, 
        productName: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        rate: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        taxPercent: { type: Number, default: 0, min: 0 },
        hsnSac: { type: String, default: "" },
        amount: { type: Number, default: 0 }
    },
    { _id: true }
);

const invoiceSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Invoice", "Sale"],
            default: "Invoice"
        },
        invoiceNumber: { type: String, required: true, unique: true, trim: true },
        saleNumber: { type: String, unique: true, trim: true },
        invoiceType: {
            type: String,
            enum: ["Intrastate", "Interstate", "International", "Standard"],
            default: "Intrastate"
        },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        // Customer Snapshots (Allows manual editing per invoice and historical tracking)
        customerName: { type: String },
        customerEmail: { type: String },
        customerPhone: { type: String },
        customerAddress: { type: String },
        customerGstin: { type: String },

        invoiceDate: { type: Date, required: true, default: Date.now },
        dueDate: { type: Date, required: true },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Unpaid", "Partially Paid", "Overdue"],
            default: "Unpaid"
        },
        items: { type: [invoiceItemSchema], default: [] },
        subtotal: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        notes: { type: String, default: "" },
        terms: { type: String, default: "" }
    },
    { timestamps: true }
);

// Virtual for amountDue
invoiceSchema.virtual('amountDue').get(function () {
    return this.grandTotal - this.paidAmount;
});

// Ensure virtuals are serialized
invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
