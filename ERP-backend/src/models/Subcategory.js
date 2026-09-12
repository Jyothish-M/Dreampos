import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        }
    },
    { timestamps: true }
);

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

export default Subcategory;
