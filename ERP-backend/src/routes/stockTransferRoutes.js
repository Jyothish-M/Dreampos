import express from "express";
import {
    getStockTransfers,
    createStockTransfer,
    deleteStockTransfer
} from "../controllers/stockTransferController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .get(protect, getStockTransfers)
    .post(protect, createStockTransfer);

router.route("/:id")
    .delete(protect, deleteStockTransfer);

export default router;
