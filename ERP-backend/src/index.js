import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import customerRoutes from "./routes/customerRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";

import subcategoryRoutes from "./routes/subcategoryRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import variantAttributeRoutes from "./routes/variantAttributeRoutes.js";
import warrantyRoutes from "./routes/warrantyRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import dropdownRoutes from "./routes/dropdownRoutes.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import bankAccountRoutes from "./routes/bankAccountRoutes.js";
import taxRoutes from "./routes/taxRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import stockAdjustmentRoutes from "./routes/stockAdjustmentRoutes.js";
import stockTransferRoutes from "./routes/stockTransferRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://dreampos-cyan.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost
    if (origin.startsWith("http://localhost")) return callback(null, true);
    // Allow any vercel.app subdomain
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true
}));
app.use(express.json());

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Existing module routes
app.use("/api/customers", customerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/variantattributes", variantAttributeRoutes);
app.use("/api/warranties", warrantyRoutes);

// Product module
app.use("/api/products", productRoutes);

// Quotation module
app.use("/api/quotations", quotationRoutes);

// Invoice module
app.use("/api/invoices", invoiceRoutes);

// Bank account module
app.use("/api/bank-accounts", bankAccountRoutes);

// Tax module
app.use("/api/taxes", taxRoutes);

// Currency module
app.use("/api/currencies", currencyRoutes);

// Purchase module
app.use("/api/purchases", purchaseRoutes);

// Dashboard module
app.use("/api/dashboard", dashboardRoutes);

// Supplier, Store, and Warehouse modules
app.use("/api/suppliers", supplierRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/warehouses", warehouseRoutes);

// Stock modules
app.use("/api/stock", stockRoutes);
app.use("/api/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);

// Asset Management module
app.use("/api/assets", assetRoutes);

// Application module (Chat, Calendar, Social, etc)
app.use("/api/application", applicationRoutes);

// Dropdown data for product form
app.use("/api", dropdownRoutes);

// Packages module
app.use("/api/packages", packageRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    status: false,
    dataFound: false
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

