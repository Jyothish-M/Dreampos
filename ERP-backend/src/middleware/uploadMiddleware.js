import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const storeUploadsDir = path.join(__dirname, "../../uploads/stores");
if (!fs.existsSync(storeUploadsDir)) fs.mkdirSync(storeUploadsDir, { recursive: true });

const warehouseUploadsDir = path.join(__dirname, "../../uploads/warehouses");
if (!fs.existsSync(warehouseUploadsDir)) fs.mkdirSync(warehouseUploadsDir, { recursive: true });

const customerUploadsDir = path.join(__dirname, "../../uploads/customers");
if (!fs.existsSync(customerUploadsDir)) fs.mkdirSync(customerUploadsDir, { recursive: true });

const brandUploadsDir = path.join(__dirname, "../../uploads/brands");
if (!fs.existsSync(brandUploadsDir)) fs.mkdirSync(brandUploadsDir, { recursive: true });

const productUploadsDir = path.join(__dirname, "../../uploads/products");
if (!fs.existsSync(productUploadsDir)) fs.mkdirSync(productUploadsDir, { recursive: true });

const csvUploadsDir = path.join(__dirname, "../../uploads/csv");
if (!fs.existsSync(csvUploadsDir)) fs.mkdirSync(csvUploadsDir, { recursive: true });

// Common Storage Configuration
const createStorage = (uploadDir) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
};

// Multer Instances
export const uploadStoreImage = multer({ storage: createStorage(storeUploadsDir), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
export const uploadWarehouseImage = multer({ storage: createStorage(warehouseUploadsDir), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
export const uploadCustomerImage = multer({ storage: createStorage(customerUploadsDir), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
export const uploadBrandImage = multer({ storage: createStorage(brandUploadsDir), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
export const uploadProductImage = multer({ storage: createStorage(productUploadsDir), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// CSV Multer
const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, csvUploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `import-${uniqueSuffix}.csv`);
    }
});
const csvFileFilter = (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv")) cb(null, true);
    else cb(new Error("Only CSV files are allowed"));
};
export const uploadCsv = multer({ storage: csvStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: csvFileFilter });

// Helper functions to delete images
const deleteFile = (dir, filename) => {
    try {
        const fullPath = path.join(dir, filename);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (error) {}
};

export const deleteStoreImage = (filename) => deleteFile(storeUploadsDir, filename);
export const deleteWarehouseImage = (filename) => deleteFile(warehouseUploadsDir, filename);
export const deleteCustomerImage = (filename) => deleteFile(customerUploadsDir, filename);
export const deleteBrandImage = (filename) => deleteFile(brandUploadsDir, filename);
export const deleteProductImage = (filename) => deleteFile(productUploadsDir, filename);
