import StockTransfer from "../models/StockTransfer.js";
import Stock from "../models/Stock.js";

// @desc    Get all stock transfers
// @route   GET /api/stock-transfers
// @access  Private
export const getStockTransfers = async (req, res) => {
    try {
        const transfers = await StockTransfer.find()
            .populate("fromWarehouse", "name")
            .populate("toWarehouse", "name")
            .populate("product", "product images sku itemCode")
            .populate("transferredBy", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            message: "Stock transfers retrieved successfully",
            data: transfers
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Create a stock transfer
// @route   POST /api/stock-transfers
// @access  Private
export const createStockTransfer = async (req, res) => {
    try {
        const { fromWarehouse, toWarehouse, product, quantityTransferred, referenceNumber, transferDate, notes } = req.body;

        // Validation
        if (!fromWarehouse || !toWarehouse || !product || !quantityTransferred || !referenceNumber) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields"
            });
        }
        
        if (fromWarehouse === toWarehouse) {
            return res.status(400).json({
                status: false,
                message: "Source and destination warehouses cannot be the same"
            });
        }

        // Ensure stock exists in source warehouse
        // We assume store is not specified for simplicity, but if your Stock model requires store, you'll need to pass it or query accordingly.
        // For this logic, let's assume we are just transferring between warehouses. If the `Stock` model has `store` as required, you should find the stock in the specific store or modify the transfer model to include `store`.
        // I will assume `store` is populated from the first available store in the warehouse for this implementation, or you can update the schema if needed. Let's just find any stock record matching the warehouse and product.
        const sourceStock = await Stock.findOne({ warehouse: fromWarehouse, product });
        
        if (!sourceStock || sourceStock.quantity < quantityTransferred) {
            return res.status(400).json({
                status: false,
                message: `Insufficient stock in the source warehouse. Current stock is ${sourceStock ? sourceStock.quantity : 0}`
            });
        }

        // Check reference number uniqueness
        const existingRef = await StockTransfer.findOne({ referenceNumber });
        if (existingRef) {
            return res.status(400).json({
                status: false,
                message: "Reference number already exists"
            });
        }

        // Deduct from source warehouse
        sourceStock.quantity -= Number(quantityTransferred);
        sourceStock.lastUpdatedBy = req.user?._id;
        await sourceStock.save();

        // Add to destination warehouse (using the same store as source for simplicity, or find one)
        let destStock = await Stock.findOne({ warehouse: toWarehouse, store: sourceStock.store, product });
        
        if (!destStock) {
            destStock = new Stock({
                warehouse: toWarehouse,
                store: sourceStock.store,
                product,
                quantity: Number(quantityTransferred),
                lastUpdatedBy: req.user?._id
            });
        } else {
            destStock.quantity += Number(quantityTransferred);
            destStock.lastUpdatedBy = req.user?._id;
        }
        await destStock.save();

        // Save transfer record
        const transfer = new StockTransfer({
            fromWarehouse,
            toWarehouse,
            product,
            quantityTransferred: Number(quantityTransferred),
            referenceNumber,
            notes,
            transferDate: transferDate || Date.now(),
            transferredBy: req.user?._id,
            status: "Completed"
        });

        await transfer.save();

        res.status(201).json({
            status: true,
            message: "Stock transfer completed successfully",
            data: transfer
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Delete stock transfer
// @route   DELETE /api/stock-transfers/:id
// @access  Private
export const deleteStockTransfer = async (req, res) => {
    try {
        const transfer = await StockTransfer.findById(req.params.id);
        
        if (!transfer) {
            return res.status(404).json({
                status: false,
                message: "Stock transfer not found"
            });
        }
        
        // Reverse the transfer
        // 1. Add back to source
        const sourceStock = await Stock.findOne({ warehouse: transfer.fromWarehouse, product: transfer.product });
        if (sourceStock) {
            sourceStock.quantity += transfer.quantityTransferred;
            await sourceStock.save();
        }
        
        // 2. Remove from dest
        const destStock = await Stock.findOne({ warehouse: transfer.toWarehouse, product: transfer.product });
        if (destStock) {
            destStock.quantity -= transfer.quantityTransferred;
            await destStock.save();
        }
        
        await transfer.remove();
        
        res.status(200).json({
            status: true,
            message: "Stock transfer reverted and deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};
