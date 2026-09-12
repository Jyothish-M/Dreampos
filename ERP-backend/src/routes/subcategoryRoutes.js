import express from "express";
import {
    getSubcategories,
    getSubcategory,
    getSubcategoriesByCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    bulkDeleteSubcategories,
    bulkUpdateSubcategoryStatus,
    exportSubcategories
} from "../controllers/subcategoryController.js"
import { protect } from "../middleware/authMiddleware.js";
import { validateBulkDelete, validateBulkUpdate } from "../middleware/validationMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/export", protect, exportSubcategories);
router.post("/bulk-delete", protect, validateBulkDelete, bulkDeleteSubcategories);
router.post("/bulk-update", protect, validateBulkUpdate, bulkUpdateSubcategoryStatus);

// GET handles both /api/subcategories and /api/categories/:id/subcategories
router.get("/", protect, (req, res, next) => {
    if (req.params.categoryId) {
        req.params.id = req.params.categoryId;
        return getSubcategoriesByCategory(req, res, next);
    }
    return getSubcategories(req, res, next);
});

router.get("/:id", protect, getSubcategory);
router.post("/", protect, createSubcategory);
router.put("/:id", protect, updateSubcategory);
router.delete("/:id", protect, deleteSubcategory);

export default router;
