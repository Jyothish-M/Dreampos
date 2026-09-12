import BankAccount from "../models/BankAccount.js";

// 1. GET /api/bank-accounts
export const getBankAccounts = async (req, res) => {
    try {
        const { search, status } = req.query;
        const query = {};

        if (status !== undefined) query.status = status === 'true';
        if (search) {
            query.$or = [
                { bankName: { $regex: search, $options: "i" } },
                { accountNumber: { $regex: search, $options: "i" } },
                { accountName: { $regex: search, $options: "i" } },
                { branch: { $regex: search, $options: "i" } },
                { ifsc: { $regex: search, $options: "i" } }
            ];
        }

        const accounts = await BankAccount.find(query).sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: "Bank accounts fetched successfully",
            data: accounts
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 2. GET /api/bank-accounts/:id
export const getBankAccountById = async (req, res) => {
    try {
        const account = await BankAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ status: false, message: "Bank account not found" });

        return res.status(200).json({ status: true, data: account });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 3. POST /api/bank-accounts/add
export const createBankAccount = async (req, res) => {
    try {
        const { bankName, accountNumber, accountName, branch, ifsc, status, isDefault } = req.body;

        // If isDefault is true, unset other defaults
        if (isDefault) {
            await BankAccount.updateMany({}, { isDefault: false });
        }

        const newAccount = await BankAccount.create({
            bankName,
            accountNumber,
            accountName,
            branch,
            ifsc,
            status,
            isDefault
        });

        return res.status(201).json({
            status: true,
            message: "Bank account created successfully",
            data: newAccount
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 4. PUT /api/bank-accounts/update/:id
export const updateBankAccount = async (req, res) => {
    try {
        const { isDefault } = req.body;

        // If isDefault is true, unset other defaults
        if (isDefault) {
            await BankAccount.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
        }

        const updated = await BankAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ status: false, message: "Bank account not found" });

        return res.status(200).json({
            status: true,
            message: "Bank account updated successfully",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 5. DELETE /api/bank-accounts/delete/:id
export const deleteBankAccount = async (req, res) => {
    try {
        const deleted = await BankAccount.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ status: false, message: "Bank account not found" });

        return res.status(200).json({
            status: true,
            message: "Bank account deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 6. PATCH /api/bank-accounts/toggle-status/:id
export const toggleBankAccountStatus = async (req, res) => {
    try {
        const account = await BankAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ status: false, message: "Bank account not found" });

        account.status = !account.status;
        await account.save();

        return res.status(200).json({
            status: true,
            message: "Bank account status updated",
            data: {
                _id: account._id,
                status: account.status
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 7. PATCH /api/bank-accounts/set-default/:id
export const setDefaultBankAccount = async (req, res) => {
    try {
        await BankAccount.updateMany({}, { isDefault: false });
        const updated = await BankAccount.findByIdAndUpdate(req.params.id, { isDefault: true, status: true }, { new: true });

        if (!updated) return res.status(404).json({ status: false, message: "Bank account not found" });

        return res.status(200).json({
            status: true,
            message: "Default bank account updated successfully",
            data: {
                _id: updated._id,
                isDefault: updated.isDefault,
                status: updated.status
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
