import express from "express";
import {
  getWarehouses,
  addWarehouse,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  toggleWarehouseStatus,
  bulkDeleteWarehouses,
  bulkUpdateWarehouses,
  exportWarehouses,
  getWarehouseReport
} from "../controllers/warehouseController.js";
import { uploadWarehouseImage } from "../middleware/uploadMiddleware.js";
import { validateBulkUpdate } from "../middleware/validationMiddleware.js";


const router = express.Router();

router.get("/", getWarehouses);
router.get("/export", exportWarehouses);
router.get("/:id/report", getWarehouseReport);
router.get("/:id", getWarehouseById);
router.post("/add", uploadWarehouseImage.single("avatar"), addWarehouse);
router.put("/:id", uploadWarehouseImage.single("avatar"), updateWarehouse);
router.patch("/:id/status", toggleWarehouseStatus);
router.delete("/:id", deleteWarehouse);
router.post("/bulk-delete", bulkDeleteWarehouses);
router.post("/bulk-update", bulkUpdateWarehouses);

export default router;
