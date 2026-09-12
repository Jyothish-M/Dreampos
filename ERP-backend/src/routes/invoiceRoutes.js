import express from "express";
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoiceNumber,
    exportInvoicesPdf,
    exportInvoicesXlsx,
    exportSingleInvoicePdf,
    updateInvoiceStatus,
    bulkDeleteInvoices,
    bulkUpdateInvoices
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware if token is required (assuming it is based on user spec)
router.use(protect);

// Utility
router.get("/generate-number", generateInvoiceNumber);

// Export Bulk
router.get("/export/pdf", exportInvoicesPdf);
router.get("/export/xlsx", exportInvoicesXlsx);

// Bulk Actions
router.post("/bulk-delete", bulkDeleteInvoices);
router.post("/bulk-update", bulkUpdateInvoices);

// Standard CRUD
router.get("/", getInvoices);
router.post("/add", createInvoice);
router.get("/:id", getInvoiceById);
router.put("/update/:id", updateInvoice);
router.delete("/delete/:id", deleteInvoice);

// Patch Status
router.patch("/:id/status", updateInvoiceStatus);

// Single Report
router.get("/:id/export/pdf", exportSingleInvoicePdf);

export default router;
