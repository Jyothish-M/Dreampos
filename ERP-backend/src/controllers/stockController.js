import Stock from "../models/Stock.js";

// @desc    Create or update a stock entry
// @route   POST /api/stock
// @access  Private
export const createStock = async (req, res) => {
    try {
        const { warehouse, store, product, quantity } = req.body;

        if (!warehouse || !store || !product || quantity === undefined) {
            return res.status(400).json({
                status: false,
                message: "Please provide warehouse, store, product, and quantity"
            });
        }

        // Check if stock record already exists for this warehouse+store+product
        let stockRecord = await Stock.findOne({ warehouse, store, product });

        if (stockRecord) {
            // If it exists, add to quantity
            stockRecord.quantity += Number(quantity);
            stockRecord.lastUpdatedBy = req.user?._id;
            await stockRecord.save();
        } else {
            // Create new stock entry
            stockRecord = new Stock({
                warehouse,
                store,
                product,
                quantity: Number(quantity),
                lastUpdatedBy: req.user?._id
            });
            await stockRecord.save();
        }

        // Populate and return
        const populated = await Stock.findById(stockRecord._id)
            .populate("warehouse", "name")
            .populate("store", "name")
            .populate("product", "product images sku itemCode")
            .populate("lastUpdatedBy", "name");

        res.status(201).json({
            status: true,
            message: "Stock created successfully",
            data: populated
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Get all stock entries
// @route   GET /api/stock
// @access  Private
export const getStocks = async (req, res) => {
    try {
        const stocks = await Stock.find()
            .populate("warehouse", "name")
            .populate("store", "name")
            .populate("product", "product images sku itemCode")
            .populate("lastUpdatedBy", "name")
            .sort({ updatedAt: -1 });
        
        res.status(200).json({
            status: true,
            message: "Stock retrieved successfully",
            data: stocks
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Get stock by ID
// @route   GET /api/stock/:id
// @access  Private
export const getStockById = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id)
            .populate("warehouse", "name")
            .populate("store", "name")
            .populate("product", "product images sku itemCode")
            .populate("lastUpdatedBy", "name");
        
        if (!stock) {
            return res.status(404).json({
                status: false,
                message: "Stock entry not found"
            });
        }
        
        res.status(200).json({
            status: true,
            data: stock
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Update stock entry directly (usually done via adjustments/transfers but keeping CRUD)
// @route   PUT /api/stock/:id
// @access  Private
export const updateStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        
        const stock = await Stock.findById(req.params.id);
        
        if (!stock) {
            return res.status(404).json({
                status: false,
                message: "Stock entry not found"
            });
        }
        
        stock.quantity = quantity;
        stock.lastUpdatedBy = req.user?._id; // Assuming user is in req from auth middleware
        
        await stock.save();
        
        res.status(200).json({
            status: true,
            message: "Stock updated successfully",
            data: stock
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Delete stock entry
// @route   DELETE /api/stock/:id
// @access  Private
export const deleteStock = async (req, res) => {
    try {
        const stock = await Stock.findByIdAndDelete(req.params.id);
        
        if (!stock) {
            return res.status(404).json({
                status: false,
                message: "Stock entry not found"
            });
        }
        
        res.status(200).json({
            status: true,
            message: "Stock entry removed"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};
