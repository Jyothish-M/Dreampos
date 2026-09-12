
import express from "express";
import {
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    bulkDeleteBrands,
    bulkUpdateStatus,
    exportBrands,
    getBrands
} from "../controllers/brandController.js";
import { uploadBrandImage } from "../middleware/uploadMiddleware.js";
import { validateBrand, validateBrandUpdate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Export brands (Must be before :id route)
router.get("/export", exportBrands);

// Bulk actions
router.post("/bulk-delete", bulkDeleteBrands);
router.post("/bulk-update", bulkUpdateStatus);

// Standard CRUD
router.get("/", getBrands);
router.post("/", uploadBrandImage.single("image"), validateBrand, createBrand);
router.get("/:id", getBrand);
router.put("/:id", uploadBrandImage.single("image"), validateBrandUpdate, updateBrand);
router.delete("/:id", deleteBrand);

export default router;
