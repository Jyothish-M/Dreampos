import express from "express";
import {
    getCurrencies,
    getCurrencyById,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    toggleCurrencyStatus
} from "../controllers/currencyController.js";

const router = express.Router();

router.get("/", getCurrencies);
router.get("/:id", getCurrencyById);
router.post("/add", createCurrency);
router.put("/update/:id", updateCurrency);
router.delete("/delete/:id", deleteCurrency);
router.patch("/toggle-status/:id", toggleCurrencyStatus);

export default router;
