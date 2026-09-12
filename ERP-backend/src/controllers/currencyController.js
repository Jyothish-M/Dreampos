import Currency from "../models/Currency.js";

// 1. GET /api/currencies
export const getCurrencies = async (req, res) => {
    try {
        const { search } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } }
            ];
        }

        const currencies = await Currency.find(query);

        // Custom sorting priority
        const PRIORITY_ORDER = ['INR', 'USD', 'AUD', 'EUR', 'AED', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD'];
        
        currencies.sort((a, b) => {
            const codeA = (a.code || "").toUpperCase();
            const codeB = (b.code || "").toUpperCase();
            
            const indexA = PRIORITY_ORDER.indexOf(codeA);
            const indexB = PRIORITY_ORDER.indexOf(codeB);
            
            const priorityA = indexA === -1 ? 999 : indexA;
            const priorityB = indexB === -1 ? 999 : indexB;
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            return (a.name || "").localeCompare(b.name || "");
        });

        return res.status(200).json({
            status: true,
            message: "Currencies fetched successfully",
            data: currencies
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 2. GET /api/currencies/:id
export const getCurrencyById = async (req, res) => {
    try {
        const currency = await Currency.findById(req.params.id);
        if (!currency) return res.status(404).json({ status: false, message: "Currency not found" });

        return res.status(200).json({
            status: true,
            message: "Currency fetched successfully",
            data: currency
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 3. POST /api/currencies/add
export const createCurrency = async (req, res) => {
    try {
        const { name, code, symbol, rate, status } = req.body;

        const newCurrency = await Currency.create({
            name,
            code,
            symbol,
            rate,
            status
        });

        return res.status(201).json({
            status: true,
            message: "Currency created successfully",
            data: newCurrency
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 4. PUT /api/currencies/update/:id
export const updateCurrency = async (req, res) => {
    try {
        const updated = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ status: false, message: "Currency not found" });

        return res.status(200).json({
            status: true,
            message: "Currency updated successfully",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 5. DELETE /api/currencies/delete/:id
export const deleteCurrency = async (req, res) => {
    try {
        const deleted = await Currency.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ status: false, message: "Currency not found" });

        return res.status(200).json({
            status: true,
            message: "Currency deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 6. PATCH /api/currencies/toggle-status/:id
export const toggleCurrencyStatus = async (req, res) => {
    try {
        const currency = await Currency.findById(req.params.id);
        if (!currency) return res.status(404).json({ status: false, message: "Currency not found" });

        currency.status = !currency.status;
        await currency.save();

        return res.status(200).json({
            status: true,
            message: "Currency status updated",
            data: {
                _id: currency._id,
                status: currency.status
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
