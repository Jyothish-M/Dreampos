import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema({
    fromWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },
    toWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantityTransferred: {
        type: Number,
        required: true,
        min: 1
    },
    referenceNumber: {
        type: String,
        required: true,
        unique: true
    },
    transferDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Cancelled"],
        default: "Completed"
    },
    notes: {
        type: String,
        trim: true
    },
    transferredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

const StockTransfer = mongoose.model("StockTransfer", stockTransferSchema);

export default StockTransfer;
