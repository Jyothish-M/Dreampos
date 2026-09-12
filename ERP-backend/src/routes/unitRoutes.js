
import express from "express";
import {
    getUnit,
    createUnit,
    updateUnit,
    deleteUnit,
    bulkDeleteUnits,
    bulkUpdateStatus,
    exportUnits,
    getUnits
} from "../controllers/unitController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateUnit, validateUnitUpdate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Export units (Must be before :id route)
router.get("/export", protect, exportUnits);

// Bulk actions
router.post("/bulk-delete", protect, bulkDeleteUnits);
router.post("/bulk-update", protect, bulkUpdateStatus);

// Standard CRUD
router.get("/", protect, getUnits);
router.post("/", protect, validateUnit, createUnit);
router.get("/:id", protect, getUnit);
router.put("/:id", protect, validateUnitUpdate, updateUnit);
router.delete("/:id", protect, deleteUnit);

export default router;
