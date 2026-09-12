import express from "express";
import {
    createStock,
    getStocks,
    getStockById,
    updateStock,
    deleteStock
} from "../controllers/stockController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .get(protect, getStocks)
    .post(protect, createStock);

router.route("/:id")
    .get(protect, getStockById)
    .put(protect, updateStock)
    .delete(protect, deleteStock);

export default router;
