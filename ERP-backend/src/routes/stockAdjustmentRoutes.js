import express from "express";
import {
    getStockAdjustments,
    createStockAdjustment,
    deleteStockAdjustment
} from "../controllers/stockAdjustmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .get(protect, getStockAdjustments)
    .post(protect, createStockAdjustment);

router.route("/:id")
    .delete(protect, deleteStockAdjustment);

export default router;
