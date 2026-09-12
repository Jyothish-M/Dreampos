
import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    image: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
