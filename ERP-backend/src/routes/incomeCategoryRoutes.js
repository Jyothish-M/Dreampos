import express from "express";
import { getIncomeCategories, createIncomeCategory, deleteIncomeCategory } from "../controllers/incomeCategoryController.js";

const router = express.Router();

router.route("/").get(getIncomeCategories).post(createIncomeCategory);
router.route("/:id").delete(deleteIncomeCategory);

export default router;
