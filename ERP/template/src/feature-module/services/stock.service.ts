import apiClient from "./api.service";

export interface Stock {
    _id?: string;
    id?: string;
    warehouse: any;
    store: any;
    product: any;
    quantity: number;
    lastUpdatedBy?: any;
    updatedAt?: string;
}

export const StockService = {
    getAll: async () => {
        try {
            const response = await apiClient.get("/stock");
            return response.data;
        } catch (error: any) {
            console.error("Failed to fetch stock:", error);
            throw error;
        }
    },

    getById: async (id: string) => {
        try {
            const response = await apiClient.get(`/stock/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("Failed to fetch stock:", error);
            throw error;
        }
    },

    create: async (data: { warehouse: string; store: string; product: string; quantity: number }) => {
        try {
            const response = await apiClient.post("/stock", data);
            return response.data;
        } catch (error: any) {
            console.error("Failed to create stock:", error);
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            const response = await apiClient.delete(`/stock/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("Failed to delete stock:", error);
            throw error;
        }
    }
};
