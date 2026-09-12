
import express from "express";
import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDeleteCategories,
    bulkUpdateStatus,
    exportCategories
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes
router.route("/")
    .get(protect, getCategories)
    .post(protect, createCategory);

router.post("/bulk-delete", protect, bulkDeleteCategories);
router.post("/bulk-update", protect, bulkUpdateStatus);
router.get("/export", protect, exportCategories);

router.route("/:id")
    .get(protect, getCategory)
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

export default router;
