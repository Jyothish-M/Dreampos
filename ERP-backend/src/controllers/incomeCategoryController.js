import IncomeCategory from "../models/IncomeCategory.js";

// GET ALL
export const getIncomeCategories = async (req, res) => {
  try {
    const categories = await IncomeCategory.find().sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: categories });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// CREATE
export const createIncomeCategory = async (req, res) => {
  try {
    const category = await IncomeCategory.create(req.body);
    res.status(201).json({ status: true, data: category, message: "Income Category added successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// DELETE
export const deleteIncomeCategory = async (req, res) => {
  try {
    await IncomeCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: true, message: "Income Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
