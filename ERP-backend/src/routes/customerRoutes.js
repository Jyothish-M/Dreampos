import express from "express";
import {
  getCustomers,
  addCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  bulkDeleteCustomers,
  bulkUpdateCustomers,
  exportCustomers,
  getCustomerReport
} from "../controllers/customerController.js";
import { uploadCustomerImage } from "../middleware/uploadMiddleware.js";
import {
  validateCustomer,
  validateCustomerUpdate,
  validateBulkDelete,
  validateBulkUpdate
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.get("/", getCustomers);
router.get("/export", exportCustomers);
router.get("/:id/report", getCustomerReport);
router.get("/:id", getCustomerById);
router.post("/add", uploadCustomerImage.single("avatar"), validateCustomer, addCustomer);
router.put("/:id", uploadCustomerImage.single("avatar"), validateCustomerUpdate, updateCustomer);
router.patch("/:id/status", toggleCustomerStatus);
router.delete("/:id", deleteCustomer);
router.post("/bulk-delete", validateBulkDelete, bulkDeleteCustomers);
router.post("/bulk-update", validateBulkUpdate, bulkUpdateCustomers);

export default router;
