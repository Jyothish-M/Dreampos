import express from "express";
import {
    getWarranties,
    getWarranty,
    createWarranty,
    updateWarranty,
    deleteWarranty,
    bulkDeleteWarranties,
    bulkUpdateStatus,
    exportWarranties
} from "../controllers/warrantyController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateWarranty, validateWarrantyUpdate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Export (must be before /:id)
router.get("/export", protect, exportWarranties);

// Bulk actions
router.post("/bulk-delete", protect, bulkDeleteWarranties);
router.post("/bulk-update", protect, bulkUpdateStatus);

// Standard CRUD
router.get("/", protect, getWarranties);
router.post("/", protect, validateWarranty, createWarranty);
router.get("/:id", protect, getWarranty);
router.put("/:id", protect, validateWarrantyUpdate, updateWarranty);
router.delete("/:id", protect, deleteWarranty);

export default router;
