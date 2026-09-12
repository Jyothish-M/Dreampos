import express from "express";
import {
  getStores,
  addStore,
  getStoreById,
  updateStore,
  deleteStore,
  toggleStoreStatus,
  bulkDeleteStores,
  bulkUpdateStores,
  exportStores,
  getStoreReport
} from "../controllers/storeController.js";
import { uploadStoreImage } from "../middleware/uploadMiddleware.js";
import { validateBulkUpdate } from "../middleware/validationMiddleware.js";


const router = express.Router();

router.get("/", getStores);
router.get("/export", exportStores);
router.get("/:id/report", getStoreReport);
router.get("/:id", getStoreById);
router.post("/add", addStore);
router.put("/:id", updateStore);
router.patch("/:id/status", toggleStoreStatus);
router.delete("/:id", deleteStore);
router.post("/bulk-delete", bulkDeleteStores);
router.post("/bulk-update", bulkUpdateStores);

export default router;
