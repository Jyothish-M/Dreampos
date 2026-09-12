import Tax from "../models/Tax.js";

// 1. GET /api/taxes
export const getTaxes = async (req, res) => {
    try {
        const { search, type } = req.query;
        const query = {};

        if (type) query.type = type;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } }
            ];
        }

        const taxes = await Tax.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: "Tax rates fetched successfully",
            data: taxes
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 2. GET /api/taxes/:id
export const getTaxById = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) return res.status(404).json({ status: false, message: "Tax rate not found" });

        return res.status(200).json({
            status: true,
            message: "Tax rate fetched successfully",
            data: tax
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 3. POST /api/taxes/add
export const createTax = async (req, res) => {
    try {
        const { name, type, rate, status } = req.body;

        const newTax = await Tax.create({
            name,
            type,
            rate,
            status
        });

        return res.status(201).json({
            status: true,
            message: "Tax rate created successfully",
            data: newTax
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 4. PUT /api/taxes/update/:id
export const updateTax = async (req, res) => {
    try {
        const updated = await Tax.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ status: false, message: "Tax rate not found" });

        return res.status(200).json({
            status: true,
            message: "Tax rate updated successfully",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 5. DELETE /api/taxes/delete/:id
export const deleteTax = async (req, res) => {
    try {
        const deleted = await Tax.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ status: false, message: "Tax rate not found" });

        return res.status(200).json({
            status: true,
            message: "Tax rate deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 6. PATCH /api/taxes/toggle-status/:id
export const toggleTaxStatus = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) return res.status(404).json({ status: false, message: "Tax rate not found" });

        tax.status = !tax.status;
        await tax.save();

        return res.status(200).json({
            status: true,
            message: "Tax rate status updated",
            data: {
                _id: tax._id,
                status: tax.status
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
