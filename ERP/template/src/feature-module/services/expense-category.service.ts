import apiClient from "./api.service";

export interface ExpenseCategoryItem {
  _id: string;
  categoryName: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export const ExpenseCategoryService = {
  getAll: async () => {
    const response = await apiClient.get("/expense-categories");
    return response.data;
  },
  create: async (data: { categoryName: string; description?: string; status?: string }) => {
    const response = await apiClient.post("/expense-categories", data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/expense-categories/${id}`);
    return response.data;
  },
};

export default ExpenseCategoryService;