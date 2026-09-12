import mongoose from "mongoose";

const stockAdjustmentSchema = new mongoose.Schema({
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    adjustmentType: {
        type: String,
        enum: ["Addition", "Subtraction"],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    notes: {
        type: String,
        trim: true
    },
    adjustedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const StockAdjustment = mongoose.model("StockAdjustment", stockAdjustmentSchema);

export default StockAdjustment;
