import mongoose from "mongoose";

const warrantySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    type: {
        type: String,
        enum: ["Days", "Months", "Years"],
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
}, {
    timestamps: true
});

const Warranty = mongoose.model("Warranty", warrantySchema);

export default Warranty;
