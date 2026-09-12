import apiClient from "./api.service";

export interface StockTransfer {
    _id?: string;
    id?: string;
    fromWarehouse: any;
    toWarehouse: any;
    product: any;
    quantityTransferred: number;
    referenceNumber: string;
    transferDate?: string;
    status?: "Pending" | "Completed" | "Cancelled";
    notes?: string;
    transferredBy?: any;
    createdAt?: string;
}

export const StockTransferService = {
    getAll: async () => {
        try {
            const response = await apiClient.get("/stock-transfers");
            return response.data;
        } catch (error: any) {
            console.error("Failed to fetch stock transfers:", error);
            throw error;
        }
    },

    create: async (data: any) => {
        try {
            const response = await apiClient.post("/stock-transfers", data);
            return response.data;
        } catch (error: any) {
            console.error("Failed to create stock transfer:", error);
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            const response = await apiClient.delete(`/stock-transfers/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("Failed to delete stock transfer:", error);
            throw error;
        }
    }
};
