import express from "express";
import {
    getTaxes,
    getTaxById,
    createTax,
    updateTax,
    deleteTax,
    toggleTaxStatus
} from "../controllers/taxController.js";

const router = express.Router();

router.get("/", getTaxes);
router.get("/:id", getTaxById);
router.post("/add", createTax);
router.put("/update/:id", updateTax);
router.delete("/delete/:id", deleteTax);
router.patch("/toggle-status/:id", toggleTaxStatus);

export default router;
