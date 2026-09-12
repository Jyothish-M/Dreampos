import apiClient from "./api.service";

export interface StockAdjustment {
    _id?: string;
    id?: string;
    warehouse: any;
    store: any;
    product: any;
    adjustmentType: "Addition" | "Subtraction";
    quantity: number;
    notes?: string;
    adjustedBy?: any;
    date?: string;
    createdAt?: string;
}

export const StockAdjustmentService = {
    getAll: async () => {
        try {
            const response = await apiClient.get("/stock-adjustments");
            return response.data;
        } catch (error: any) {
            console.error("Failed to fetch stock adjustments:", error);
            throw error;
        }
    },

    create: async (data: any) => {
        try {
            const response = await apiClient.post("/stock-adjustments", data);
            return response.data;
        } catch (error: any) {
            console.error("Failed to create stock adjustment:", error);
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            const response = await apiClient.delete(`/stock-adjustments/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("Failed to delete stock adjustment:", error);
            throw error;
        }
    }
};
