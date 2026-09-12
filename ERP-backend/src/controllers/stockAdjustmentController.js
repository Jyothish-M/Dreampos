import StockAdjustment from "../models/StockAdjustment.js";
import Stock from "../models/Stock.js";

// @desc    Get all stock adjustments
// @route   GET /api/stock-adjustments
// @access  Private
export const getStockAdjustments = async (req, res) => {
    try {
        const adjustments = await StockAdjustment.find()
            .populate("warehouse", "name")
            .populate("store", "name")
            .populate("product", "product images sku itemCode")
            .populate("adjustedBy", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            message: "Stock adjustments retrieved successfully",
            data: adjustments
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Create a stock adjustment
// @route   POST /api/stock-adjustments
// @access  Private
export const createStockAdjustment = async (req, res) => {
    try {
        const { warehouse, store, product, adjustmentType, quantity, notes, date } = req.body;

        // Validation
        if (!warehouse || !store || !product || !adjustmentType || !quantity) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields"
            });
        }

        // Find existing stock record
        let stockRecord = await Stock.findOne({ warehouse, store, product });
        
        if (!stockRecord) {
            // If it doesn't exist, we can't subtract from 0
            if (adjustmentType === "Subtraction") {
                return res.status(400).json({
                    status: false,
                    message: "Cannot subtract stock from a non-existent inventory record"
                });
            }
            
            // Create a new stock record if it's an addition
            stockRecord = new Stock({
                warehouse,
                store,
                product,
                quantity: 0,
                lastUpdatedBy: req.user?._id
            });
        } else {
            // If it exists, ensure subtraction doesn't go below 0
            if (adjustmentType === "Subtraction" && stockRecord.quantity < quantity) {
                return res.status(400).json({
                    status: false,
                    message: `Insufficient stock. Current stock is ${stockRecord.quantity}`
                });
            }
        }

        // Apply adjustment to stock record
        if (adjustmentType === "Addition") {
            stockRecord.quantity += Number(quantity);
        } else if (adjustmentType === "Subtraction") {
            stockRecord.quantity -= Number(quantity);
        }
        
        stockRecord.lastUpdatedBy = req.user?._id;
        await stockRecord.save();

        // Save adjustment record
        const adjustment = new StockAdjustment({
            warehouse,
            store,
            product,
            adjustmentType,
            quantity: Number(quantity),
            notes,
            date: date || Date.now(),
            adjustedBy: req.user?._id
        });

        await adjustment.save();

        res.status(201).json({
            status: true,
            message: "Stock adjustment created successfully",
            data: adjustment
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Delete stock adjustment (and optionally revert stock changes)
// @route   DELETE /api/stock-adjustments/:id
// @access  Private
export const deleteStockAdjustment = async (req, res) => {
    try {
        const adjustment = await StockAdjustment.findById(req.params.id);
        
        if (!adjustment) {
            return res.status(404).json({
                status: false,
                message: "Stock adjustment not found"
            });
        }
        
        // Revert the stock changes
        const stockRecord = await Stock.findOne({
            warehouse: adjustment.warehouse,
            store: adjustment.store,
            product: adjustment.product
        });
        
        if (stockRecord) {
            if (adjustment.adjustmentType === "Addition") {
                stockRecord.quantity -= adjustment.quantity;
            } else if (adjustment.adjustmentType === "Subtraction") {
                stockRecord.quantity += adjustment.quantity;
            }
            await stockRecord.save();
        }
        
        await adjustment.remove();
        
        res.status(200).json({
            status: true,
            message: "Stock adjustment reverted and deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};
