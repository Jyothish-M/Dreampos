import { useState, useEffect, useRef } from "react";
import apiClient from "../../services/api.service";

const IncomeList = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState({
    store: "",
    category: "",
    notes: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch all incomes from backend (MongoDB)
  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/incomes");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setListData(data);
      }
    } catch (error) {
      console.error("Failed to fetch incomes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stores from backend (MongoDB) for the dropdown
  const fetchStores = async () => {
    try {
      const res = await apiClient.get("/stores");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setStores(data.filter((s: any) => s.status === "Active" || !s.status));
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }
  };

  // Fetch income categories from backend (MongoDB) for the dropdown
  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/income-categories");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setCategories(data.filter((c: any) => c.status === "Active" || !c.status));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchStores();
    fetchCategories();
  }, []);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit new income to backend (saves to MongoDB)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.store || !formData.category || !formData.notes || !formData.amount) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.post("/incomes", {
        ...formData,
        amount: Number(formData.amount),
      });
      alert("Income added successfully!");
      setFormData({
        store: "",
        category: "",
        notes: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowModal(false);
      fetchIncomes(); // Refresh list from MongoDB
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to add income.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete income from backend (removes from MongoDB)
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this income?")) {
      try {
        await apiClient.delete(`/incomes/${id}`);
        alert("Income deleted successfully!");
        fetchIncomes(); // Refresh list from MongoDB
      } catch (error) {
        alert("Failed to delete income.");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Page Header */}
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Income List</h4>
              <h6>Manage your income records</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <a data-bs-toggle="tooltip" title="Pdf">
                <img src="/assets/img/icons/pdf.svg" alt="pdf" />
              </a>
            </li>
            <li>
              <a data-bs-toggle="tooltip" title="Excel">
                <img src="/assets/img/icons/excel.svg" alt="excel" />
              </a>
            </li>
            <li>
              <a data-bs-toggle="tooltip" title="Print">
                <img src="/assets/img/icons/printer.svg" alt="print" />
              </a>
            </li>
          </ul>
          <div className="page-btn">
            <button
              className="btn btn-added"
              onClick={() => setShowModal(true)}
            >
              <i className="feather-plus-circle me-2" />
              Add New Income
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search..."
                  />
                  <a className="btn btn-searchset">
                    <i className="feather-search" />
                  </a>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table datanew">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Store</th>
                    <th>Category</th>
                    <th>Notes</th>
                    <th>Amount</th>
                    <th className="no-sort">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Loading from database...
                      </td>
                    </tr>
                  ) : listData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No income records found. Click &quot;Add New Income&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    listData.map((income: any) => (
                      <tr key={income._id}>
                        <td>{formatDate(income.date)}</td>
                        <td>
                          <span className="badge bg-soft-primary text-primary">
                            {income.reference}
                          </span>
                        </td>
                        <td>{income.store}</td>
                        <td>{income.category}</td>
                        <td>{income.notes}</td>
                        <td className="fw-semibold text-success">
                          ${Number(income.amount).toFixed(2)}
                        </td>
                        <td className="action-table-data">
                          <div className="edit-delete-action">
                            <a className="me-2 p-2" href="#" data-bs-toggle="tooltip" title="Edit">
                              <i className="feather-edit" />
                            </a>
                            <a
                              className="confirm-text p-2"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(income._id);
                              }}
                              data-bs-toggle="tooltip"
                              title="Delete"
                            >
                              <i className="feather-trash-2" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Income Modal */}
        {showModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Income</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    ref={closeBtnRef}
                  />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Store <span className="text-danger">*</span>
                      </label>
                      <select
                        name="store"
                        className="form-select"
                        value={formData.store}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Store --</option>
                        {stores.length > 0 ? (
                          stores.map((s: any) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No stores found</option>
                        )}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        name="category"
                        className="form-select"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Category --</option>
                        {categories.length > 0 ? (
                          categories.map((c: any) => (
                            <option key={c._id} value={c.name}>
                              {c.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No categories found</option>
                        )}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Notes <span className="text-danger">*</span>
                      </label>
                      <textarea
                        name="notes"
                        className="form-control"
                        rows={2}
                        placeholder="e.g. Services that have been verified"
                        value={formData.notes}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Amount ($) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="amount"
                        className="form-control"
                        placeholder="e.g. 500"
                        value={formData.amount}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Save Income"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default IncomeList;
