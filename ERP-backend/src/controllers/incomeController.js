import Income from "../models/Income.js";

// GET ALL
export const getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find().sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: incomes });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// CREATE
export const createIncome = async (req, res) => {
  try {
    const income = await Income.create(req.body);
    res.status(201).json({ status: true, data: income, message: "Income added successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// DELETE
export const deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: true, message: "Income deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
