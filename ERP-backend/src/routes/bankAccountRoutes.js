import express from "express";
import {
    getBankAccounts,
    getBankAccountById,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    toggleBankAccountStatus,
    setDefaultBankAccount
} from "../controllers/bankAccountController.js";

const router = express.Router();

router.get("/", getBankAccounts);
router.get("/:id", getBankAccountById);
router.post("/add", createBankAccount);
router.put("/update/:id", updateBankAccount);
router.delete("/delete/:id", deleteBankAccount);
router.patch("/toggle-status/:id", toggleBankAccountStatus);
router.patch("/set-default/:id", setDefaultBankAccount);

export default router;
