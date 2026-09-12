import express from "express";
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    bulkUpdateProducts,
    toggleProductStatus,
    uploadProductImages,
    getProductImages,
    deleteProductImageById,
    getCustomFields,
    saveCustomFields,
    checkSku,
    generateSku,
    exportProducts,
    downloadSampleCsv,
    importProducts
} from "../controllers/productController.js";

import { uploadProductImage, uploadCsv } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all product routes
router.use(protect);

// Utility  
router.get("/check-sku", checkSku);
router.get("/generate-sku", generateSku);

router.get("/export", exportProducts);
router.get("/import/sample", downloadSampleCsv);
router.post("/import", uploadCsv.single("file"), importProducts);

// Bulk actions  
router.post("/bulk-delete", bulkDeleteProducts);
router.post("/bulk-update", bulkUpdateProducts);

// Standard CRUD 
router.get("/", getProducts);
router.post("/", createProduct);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Status toggle 
router.patch("/:id/status", toggleProductStatus);

// Image management 
router.post("/:id/images", uploadProductImage.single("image"), uploadProductImages);
router.get("/:id/images", getProductImages);
router.delete("/:id/images/:imgId", deleteProductImageById);

// Custom fields 
router.get("/:id/custom-fields", getCustomFields);
router.post("/:id/custom-fields", saveCustomFields);

export default router;
