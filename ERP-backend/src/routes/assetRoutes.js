import express from "express";
import { getAssets, createAsset } from "../controllers/assetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth protection
router.use(protect);

router.route("/")
  .get(getAssets)
  .post(createAsset);

export default router;
