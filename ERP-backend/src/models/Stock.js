import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}, {
    timestamps: true
});

// Ensure that a product is uniquely tracked per warehouse-store combination
stockSchema.index({ warehouse: 1, store: 1, product: 1 }, { unique: true });

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;
