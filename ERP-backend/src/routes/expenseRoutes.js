import express from "express";
import {
  getAllExpenses,
  createExpense,
  deleteExpense,
} from "../controllers/expenseController.js"; 

const router = express.Router();

router.get("/", getAllExpenses);
router.post("/", createExpense);
router.delete("/:id", deleteExpense);

export default router;