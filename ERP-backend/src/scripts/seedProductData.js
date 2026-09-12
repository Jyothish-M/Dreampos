
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

import Store from "../models/Store.js";
import Warehouse from "../models/Warehouse.js";
import SellingType from "../models/SellingType.js";
import BarcodeSymbology from "../models/BarcodeSymbology.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/erp";

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        //Stores 
        const storeCount = await Store.countDocuments();
        if (storeCount === 0) {
            await Store.insertMany([
                { name: "Main Store", address: "123 Main Street", phone: "+91-9999000001" },
                { name: "Warehouse Store", address: "456 Industrial Area", phone: "+91-9999000002" },
                { name: "Branch Store", address: "789 City Road", phone: "+91-9999000003" }
            ]);
            console.log("✅ Stores seeded (3 records)");
        } else {
            console.log(`ℹ️  Stores already seeded (${storeCount} records)`);
        }

        //Warehouses
        const warehouseCount = await Warehouse.countDocuments();
        if (warehouseCount === 0) {
            await Warehouse.insertMany([
                { name: "Central Warehouse", address: "1 Warehouse Blvd", phone: "+91-9999000010" },
                { name: "East Warehouse", address: "2 East Industrial Park", phone: "+91-9999000011" },
                { name: "West Warehouse", address: "3 West Storage Zone", phone: "+91-9999000012" }
            ]);
            console.log("✅ Warehouses seeded (3 records)");
        } else {
            console.log(`ℹ️  Warehouses already seeded (${warehouseCount} records)`);
        }

        //Selling Types 
        const sellingTypeCount = await SellingType.countDocuments();
        if (sellingTypeCount === 0) {
            await SellingType.insertMany([
                { name: "Transactional" },
                { name: "Solution" },
                { name: "Subscription" }
            ]);
            console.log("✅ Selling Types seeded (3 records)");
        } else {
            console.log(`ℹ️  Selling Types already seeded (${sellingTypeCount} records)`);
        }

        // Barcode Symbologies 
        const barcodeCount = await BarcodeSymbology.countDocuments();
        if (barcodeCount === 0) {
            await BarcodeSymbology.insertMany([
                { name: "CODE128" },
                { name: "EAN13" },
                { name: "EAN8" },
                { name: "UPC-A" },
                { name: "QR Code" },
                { name: "ITF-14" },
                { name: "Code 39" }
            ]);
            console.log("✅ Barcode Symbologies seeded (7 records)");
        } else {
            console.log(`ℹ️  Barcode Symbologies already seeded (${barcodeCount} records)`);
        }

        console.log("\n🎉 Product data seeding complete!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
};

seed();
