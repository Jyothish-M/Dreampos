import apiClient from "./api.service";

export interface Asset {
  _id?: string;
  name: string;
  type: string;
  serialNumber: string;
  status: "Active" | "Inactive";
  createdAt?: string;
}

export const getAssets = async () => {
  const response = await apiClient.get("/assets");
  return response.data;
};

export const createAsset = async (assetData: Asset) => {
  const response = await apiClient.post("/assets", assetData);
  return response.data;
};