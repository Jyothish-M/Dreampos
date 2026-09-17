import ExpenseCategory from "../models/ExpenseCategory.js";

// GET ALL from DB
export const getAllExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ createdAt: -1 });
    return res.status(200).json({
      status: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// CREATE in DB
export const createExpenseCategory = async (req, res) => {
  try {
    const { categoryName, description, status } = req.body;
    if (!categoryName) {
      return res.status(400).json({
        status: false,
        message: "Category Name is required",
      });
    }

    const newCategory = new ExpenseCategory({
      categoryName,
      description: description || "",
      status: status || "Active",
    });

    await newCategory.save();
    return res.status(201).json({
      status: true,
      data: newCategory,
      message: "Expense Category created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// DELETE from DB
export const deleteExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await ExpenseCategory.findByIdAndDelete(id);
    return res.status(200).json({
      status: true,
      message: "Expense Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};