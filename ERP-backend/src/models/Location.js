import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true }, 
    phoneCode: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    countryCode: { type: String, required: true },
    stateCode: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

stateSchema.index({ name: 1, countryCode: 1 }, { unique: true });

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    stateCode: { type: String },
    countryCode: { type: String, required: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

citySchema.index({ name: 1, stateCode: 1, countryCode: 1 }, { unique: true });

export const Country = mongoose.model("Country", countrySchema);
export const State = mongoose.model("State", stateSchema);
export const City = mongoose.model("City", citySchema);
