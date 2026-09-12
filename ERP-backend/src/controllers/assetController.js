import Asset from "../models/Asset.js";

// @desc    Get all assets
// @route   GET /api/assets
export const getAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: true,
      dataFound: true,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
export const createAsset = async (req, res, next) => {
  try {
    const newAsset = await Asset.create(req.body);
    res.status(201).json({
      status: true,
      message: "Asset added successfully",
      data: newAsset,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: false,
        message: "An asset with this Serial Number already exists",
      });
    }
    next(error);
  }
};
