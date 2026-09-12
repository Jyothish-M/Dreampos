import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "./src/models/Stock.js";
import Product from "./src/models/Product.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const stocks = await Stock.find()
      .populate("warehouse", "name")
      .populate("store", "name")
      .populate("product", "product images sku itemCode name") 
      .lean();

    console.log("Stocks found:", stocks.length);
    if (stocks.length > 0) {
      console.log("Sample Stock:", JSON.stringify(stocks[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
