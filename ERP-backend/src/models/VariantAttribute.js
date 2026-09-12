import mongoose from "mongoose";

const variantAttributeSchema = new mongoose.Schema({
    variant: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    values: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
}, {
    timestamps: true
});

const VariantAttribute = mongoose.model("VariantAttribute", variantAttributeSchema);

export default VariantAttribute;
