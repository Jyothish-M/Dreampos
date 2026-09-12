import express from "express";
import {
    getQuotations,
    createQuotation,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    updateQuotationStatus,
    bulkDeleteQuotations,
    bulkUpdateQuotations,
    exportSingleQuotationPdf,
    exportQuotationsPdf,
    exportQuotationsXlsx,
    generateQuotationNumber,
    convertQuotationToInvoice
} from "../controllers/quotationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

//  Utility (must be before /:id) 
router.get("/generate-number", generateQuotationNumber);

//  Export All (must be before /:id)
router.get("/export/pdf", exportQuotationsPdf);
router.get("/export/xlsx", exportQuotationsXlsx);

//  Bulk Actions 
router.post("/bulk-delete", bulkDeleteQuotations);
router.post("/bulk-update", bulkUpdateQuotations);

//  Standard CRUD 
router.get("/", getQuotations);
router.post("/add", createQuotation);
router.get("/:id", getQuotationById);
router.put("/update/:id", updateQuotation);
router.delete("/delete/:id", deleteQuotation);

// Status 
router.patch("/:id/status", updateQuotationStatus);

//Single Quotation PDF 
router.get("/:id/export/pdf", exportSingleQuotationPdf);

// Convert to Invoice 
router.post("/:id/convert", convertQuotationToInvoice);

export default router;
