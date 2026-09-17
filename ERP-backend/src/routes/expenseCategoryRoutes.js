import express from "express";
import {
  getAllExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expenseCategoryController.js";

const router = express.Router();

router.get("/", getAllExpenseCategories);
router.post("/", createExpenseCategory);
router.delete("/:id", deleteExpenseCategory);

export default router;