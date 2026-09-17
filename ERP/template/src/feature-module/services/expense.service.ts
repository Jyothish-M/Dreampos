import apiClient from "./api.service";

export interface ExpenseItem {
  _id: string;
  reference?: string;
  title: string;
  amount: number;
  category: string;
  date?: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export const ExpenseService = {
  getAll: async () => {
    const response = await apiClient.get("/expenses");
    return response.data;
  },
  create: async (data: Partial<ExpenseItem>) => {
    const response = await apiClient.post("/expenses", data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },
};

export default ExpenseService;