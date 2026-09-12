import express from "express";
import {
    createVariantAttribute,
    getVariantAttributes,
    getVariantAttribute,
    updateVariantAttribute,
    deleteVariantAttribute,
    bulkDeleteVariantAttributes,
    exportVariantAttributes
} from "../controllers/variantAttributeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Export (Must be before /:id routes)
router.get("/export", protect, exportVariantAttributes);

// Bulk delete
router.post("/bulk-delete", protect, bulkDeleteVariantAttributes);

// Standard CRUD
router.get("/", protect, getVariantAttributes);
router.post("/", protect, createVariantAttribute);
router.get("/:id", protect, getVariantAttribute);
router.put("/:id", protect, updateVariantAttribute);
router.delete("/:id", protect, deleteVariantAttribute);

export default router;
