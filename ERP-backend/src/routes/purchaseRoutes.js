import express from "express";
import {
    getPurchases,
    createPurchase,
    deletePurchase,
    getPurchaseById,
    bulkDeletePurchases,
    bulkUpdatePurchases,
    exportPurchasesPdf,
    exportPurchasesXlsx,
    updatePurchase
} from "../controllers/purchaseController.js";

const router = express.Router();

router.get("/", getPurchases);
router.post("/add", createPurchase);
router.get("/export/pdf", exportPurchasesPdf);
router.get("/export/xlsx", exportPurchasesXlsx);

router.get("/:id", getPurchaseById);
router.put("/update/:id", updatePurchase);
router.delete("/delete/:id", deletePurchase);

// Bulk actions
router.post("/bulk-delete", bulkDeletePurchases);
router.post("/bulk-update", bulkUpdatePurchases);

export default router;
