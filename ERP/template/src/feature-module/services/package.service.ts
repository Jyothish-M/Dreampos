import apiClient from "./api.service";

export const PackageService = {
  getPackages: async () => {
    const response = await apiClient.get("/packages");
    return response.data;
  },
  
  addPackage: async (packageData: any) => {
    const response = await apiClient.post("/packages/add", packageData);
    return response.data;
  },

  updatePackage: async (id: string, packageData: any) => {
    const response = await apiClient.put(`/packages/${id}`, packageData);
    return response.data;
  },

  deletePackage: async (id: string) => {
    const response = await apiClient.delete(`/packages/${id}`);
    return response.data;
  }
};
