import api from "./api.service";

export interface VariantAttribute {
  id?: string;
  variant: string;
  values: string;
  status: "Active" | "Inactive";
  createdAt?: string;
  createdon?: string;
}

export interface GetVariantAttributesResponse {
  message: string;
  status: boolean;
  dataFound: boolean;
  data: VariantAttribute[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const VariantAttributeService = {
  getAll: async (params: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get<GetVariantAttributesResponse>("/variantattributes", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/variantattributes/${id}`);
    return response.data;
  },

  create: async (data: VariantAttribute) => {
    const response = await api.post("/variantattributes", data);
    return response.data;
  },

  update: async (id: string, data: Partial<VariantAttribute>) => {
    const response = await api.put(`/variantattributes/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/variantattributes/${id}`);
    return response.data;
  },

  bulkDelete: async (ids: string[]) => {
    const response = await api.post("/variantattributes/bulk-delete", { ids });
    return response.data;
  },

  exportData: async (format: 'xlsx' | 'pdf') => {
    try {
      const res = await api.get("/variantattributes/export", {
        params: { format },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `variant-attributes_${new Date().getTime()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Make sure the backend is running.");
    }
  },
};
