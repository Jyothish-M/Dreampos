import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Asset type is required"],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, "Serial number or license key is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Asset", AssetSchema);
