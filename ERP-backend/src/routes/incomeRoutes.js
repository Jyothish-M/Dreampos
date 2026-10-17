import express from "express";
import { getIncomes, createIncome, deleteIncome } from "../controllers/incomeController.js";

const router = express.Router();

router.route("/").get(getIncomes).post(createIncome);
router.route("/:id").delete(deleteIncome);

export default router;
