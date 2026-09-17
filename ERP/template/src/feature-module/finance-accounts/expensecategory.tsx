import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import ExpenseCategoryService, {
  type ExpenseCategoryItem,
} from "../services/expense-category.service";

const ExpenseCategory = () => {
  const [data, setData] = useState<ExpenseCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Form State
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch from MongoDB
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ExpenseCategoryService.getAll();
      if (res.status && Array.isArray(res.data)) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Submit to MongoDB
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert("Please enter a Category Name");
      return;
    }

    try {
      setSubmitting(true);
      const res = await ExpenseCategoryService.create({
        categoryName,
        description,
        status,
      });

      if (res.status) {
        // Close modal
        const closeBtn = document.querySelector(
          "#add-units .btn-close, #add-category .btn-close, .modal .btn-close",
        ) as HTMLElement;
        closeBtn?.click();

        // Reset form
        setCategoryName("");
        setDescription("");
        setStatus("Active");

        // Reload data from DB
        fetchData();
      } else {
        alert("Failed to save: " + res.message);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete from MongoDB
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await ExpenseCategoryService.delete(id);
      fetchData();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // 4. Search Filter
  const filteredData = data.filter((item) => {
    const name = (item.categoryName || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 5. Table Columns matching DreamsPOS
  const columns = [
    {
      header: "Category Name",
      field: "categoryName",
      body: (row: any) => (
        <span className="fw-semibold">{row.categoryName}</span>
      ),
    },
    {
      header: "Description",
      field: "description",
      body: (row: any) => <span>{row.description || "—"}</span>,
    },
    {
      header: "Status",
      field: "status",
      body: (row: any) => {
        const isActive = (row.status || "Active") === "Active";
        return (
          <span
            className={`badge ${isActive ? "bg-success text-white" : "bg-danger text-white"}`}
            style={{
              borderRadius: "4px",
              padding: "5px 10px",
              fontSize: "12px",
            }}
          >
            {row.status || "Active"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      field: "_id",
      body: (row: any) => (
        <div className="action-table-data d-flex align-items-center gap-2">
          <Link className="p-1 text-muted" to="#">
            <i className="feather icon-edit" />
          </Link>
          <button
            type="button"
            className="p-1 text-muted border-0 bg-transparent"
            onClick={() => handleDelete(row._id)}
          >
            <i className="feather icon-trash-2 text-danger" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Top Header */}
        <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="page-title fw-bold mb-1">Expense Category</h3>
            <p className="text-muted mb-0">Manage Expense Categories</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-light border text-muted p-2 rounded"
              onClick={fetchData}
              title="Refresh"
            >
              <i className="feather icon-rotate-cw fs-16" />
            </button>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 px-3"
              style={{ backgroundColor: "#ff6f28", borderColor: "#ff6f28" }}
              data-bs-toggle="modal"
              data-bs-target="#add-units"
            >
              <i className="feather icon-plus-circle" />
              Add Expense Category
            </button>
          </div>
        </div>

        {/* Card Body & Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3">
            <div className="mb-3" style={{ width: "260px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: "42px", borderRadius: "8px" }}
              />
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">
                  Loading categories from database...
                </p>
              </div>
            ) : (
              <PrimeDataTable
                data={filteredData}
                column={columns}
                totalRecords={filteredData.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Add Expense Category Modal (Matching Screenshot) ── */}
      <div
        className="modal fade"
        id="add-units"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-0 pb-0 justify-content-between">
              <h5 className="modal-title fw-bold">Add Expense Category</h5>
              <button
                type="button"
                className="btn-close d-flex align-items-center justify-content-center text-white"
                data-bs-dismiss="modal"
                aria-label="Close"
                style={{
                  backgroundColor: "#ff0000",
                  borderRadius: "50%",
                  opacity: 1,
                  width: "32px",
                  height: "32px",
                  padding: "0",
                }}
              />
            </div>

            <form onSubmit={handleAddCategory}>
              <div className="modal-body pt-3">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Category Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter category name"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  style={{ backgroundColor: "#0b2545", borderColor: "#0b2545" }}
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  style={{ backgroundColor: "#ff6f28", borderColor: "#ff6f28" }}
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* ── End Modal ── */}
    </div>
  );
};

export default ExpenseCategory;
