import React, { useEffect, useState } from "react";
import { getAssets, createAsset, type Asset } from "../services/asset.service";

const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await getAssets();
      if (data.status) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !serialNumber) return;

    try {
      await createAsset({ name, type, serialNumber, status: "Active" });
      setName("");
      setType("");
      setSerialNumber("");
      fetchAssets(); // Refresh list
    } catch (error) {
      console.error("Error creating asset:", error);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header Block */}
        <div className="page-header">
          <div className="add-item d-flex = flex-wrap justify-content-between align-items-center w-100">
            <div className="page-title">
              <h4>Asset Registry</h4>
              <h6>Manage company physical and digital assets</h6>
            </div>
          </div>
        </div>

        {/* Input Form Card */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Add New Asset</h5>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Asset Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type (e.g. Laptop, Software)"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Serial/License Key"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100">
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table List Card */}
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table datanew">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Serial Number</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center">
                        Loading assets...
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No assets found.
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => (
                      <tr key={asset._id}>
                        <td>{asset.name}</td>
                        <td>{asset.type}</td>
                        <td>{asset.serialNumber}</td>
                        <td>
                          <span
                            className={`badge ${asset.status === "Active" ? "bg-success" : "bg-danger"}`}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td>
                          {asset.createdAt
                            ? new Date(asset.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetList;
