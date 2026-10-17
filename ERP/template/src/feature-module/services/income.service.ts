import apiClient from "./api.service";

export interface IncomeItem {
  _id: string;
  date: string;
  reference?: string;
  store: string;
  category: string;
  notes: string;
  amount: number;
}

export const IncomeService = {
  getAll: async () => {
    const response = await apiClient.get("/incomes");
    return response.data;
  },
  create: async (data: Partial<IncomeItem>) => {
    const response = await apiClient.post("/incomes", data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/incomes/${id}`);
    return response.data;
  }
};

export default IncomeService;
