import express from "express";
import {
  getSuppliers,
  addSupplier,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  bulkDeleteSuppliers,
  bulkUpdateSuppliers,
  exportSuppliers,
  getSupplierReport
} from "../controllers/supplierController.js";
import { validateBulkUpdate } from "../middleware/validationMiddleware.js";


const router = express.Router();

router.get("/", getSuppliers);
router.get("/export", exportSuppliers);
router.get("/:id/report", getSupplierReport);
router.get("/:id", getSupplierById);
router.post("/add", addSupplier);
router.put("/:id", updateSupplier);
router.patch("/:id/status", toggleSupplierStatus);
router.delete("/:id", deleteSupplier);
router.post("/bulk-delete", bulkDeleteSuppliers);
router.post("/bulk-update", bulkUpdateSuppliers);

export default router;
