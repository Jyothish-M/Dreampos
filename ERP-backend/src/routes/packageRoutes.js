import express from "express";
import {
  getPackages,
  addPackage,
  updatePackage,
  deletePackage,
} from "../controllers/packageController.js";

const router = express.Router();

router.get("/", getPackages);
router.post("/add", addPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

export default router;
