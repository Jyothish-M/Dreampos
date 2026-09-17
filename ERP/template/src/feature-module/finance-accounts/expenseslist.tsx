import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import ExpenseService from "../services/expense.service";
import apiClient from "../services/api.service";

const ExpensesList = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form State for Add Expense
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    amount: "",
    description: "",
    status: "Active",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // 1. Fetch live Categories from Backend Database
  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/expense-categories?limit=100");
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list);
        const defaultCat =
          list[0].categoryName || list[0].name || list[0].category || "General";
        setFormData((prev) => ({
          ...prev,
          category: defaultCat,
        }));
      }
    } catch (error) {
      console.error("Failed to load expense categories from database:", error);
    }
  };

  // 2. Fetch live Expenses from Database
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await ExpenseService.getAll();
      if (res.status && Array.isArray(res.data)) {
        setListData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  // 3. Handle Form Submit (Validates title, amount, and REQUIRED description)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter Expense Name");
      return;
    }
    if (!formData.amount) {
      alert("Please enter Amount");
      return;
    }
    if (!formData.description.trim()) {
      alert("Please enter Description (Required)");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category || categories[0]?.categoryName || "General",
        description: formData.description.trim(), // Required by backend
        date: formData.date || new Date().toISOString(),
        status: formData.status || "Active",
      };

      const res = await ExpenseService.create(payload);

      if (res.status) {
        closeBtnRef.current?.click();
        const defaultCat =
          categories[0]?.categoryName || categories[0]?.name || "General";
        setFormData({
          title: "",
          category: defaultCat,
          amount: "",
          description: "",
          status: "Active",
          date: new Date().toISOString().split("T")[0],
        });
        fetchExpenses(); // Refresh list from DB
      } else {
        alert("Failed to add expense: " + res.message);
      }
    } catch (error: any) {
      console.error("Failed to add expense:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      await ExpenseService.delete(id);
      fetchExpenses();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // 5. Search & Filters
  const filteredData = listData
    .filter((item) => item.title || item.expenseName || Number(item.amount) > 0)
    .filter((item) => {
      const ref = (item.reference || "").toLowerCase();
      const name = (item.title || item.expenseName || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        ref.includes(query) ||
        name.includes(query) ||
        cat.includes(query) ||
        desc.includes(query);

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All" ||
        (item.status || "Approved") === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

  // Columns definition matching DreamsPOS
  const columns = [
    {
      header: "Reference",
      field: "reference",
      body: (data: any) => <span>{data.reference || "—"}</span>,
    },
    {
      header: "Expense Name",
      field: "title",
      body: (data: any) => <span>{data.title || data.expenseName || "—"}</span>,
    },
    {
      header: "Category",
      field: "category",
      body: (data: any) => <span>{data.category || "—"}</span>,
    },
    {
      header: "Description",
      field: "description",
      body: (data: any) => <span>{data.description || "—"}</span>,
    },
    {
      header: "Date",
      field: "date",
      body: (data: any) => (
        <span>
          {data.date || data.createdAt
            ? new Date(data.date || data.createdAt).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )
            : "—"}
        </span>
      ),
    },
    {
      header: "Amount",
      field: "amount",
      body: (data: any) => (
        <span>${Number(data.amount || 0).toLocaleString()}</span>
      ),
    },
    {
      header: "Status",
      field: "status",
      body: (data: any) => {
        const status = data.status || "Active";
        return (
          <span
            className={`badge ${
              status === "Approved" || status === "Active"
                ? "bg-success text-white"
                : "bg-info text-white"
            }`}
            style={{
              borderRadius: "4px",
              padding: "5px 10px",
              fontSize: "12px",
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      field: "_id",
      body: (data: any) => (
        <div className="action-table-data d-flex align-items-center gap-2">
          <Link className="p-1 text-muted" to="#">
            <i className="feather icon-eye" />
          </Link>
          <Link className="p-1 text-muted" to="#">
            <i className="feather icon-edit" />
          </Link>
          <button
            type="button"
            className="p-1 text-muted border-0 bg-transparent"
            onClick={() => handleDelete(data._id)}
          >
            <i className="feather icon-trash-2" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="page-title fw-bold mb-1">Expenses</h3>
            <p className="text-muted mb-0">Manage Your Expenses</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-light border text-danger p-2 rounded"
              title="Export PDF"
            >
              <i className="feather icon-file-text fs-16" />
            </button>
            <button
              className="btn btn-outline-light border text-success p-2 rounded"
              title="Export Excel"
            >
              <i className="feather icon-file fs-16" />
            </button>
            <button
              className="btn btn-outline-light border text-muted p-2 rounded"
              onClick={fetchExpenses}
              title="Refresh"
            >
              <i className="feather icon-rotate-cw fs-16" />
            </button>
            <button
              className="btn btn-outline-light border text-muted p-2 rounded"
              title="Collapse"
            >
              <i className="feather icon-chevron-up fs-16" />
            </button>

            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 px-3"
              style={{ backgroundColor: "#ff6f28", borderColor: "#ff6f28" }}
              data-bs-toggle="modal"
              data-bs-target="#add-expense-modal"
            >
              <i className="feather icon-plus-circle" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Card Body & Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
              <div className="position-relative" style={{ width: "260px" }}>
                <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                  <i className="feather icon-search" />
                </span>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ height: "42px", borderRadius: "8px" }}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* 🔍 Dynamic Category Dropdown from Expense Category Backend */}
                <select
                  className="form-select text-muted"
                  style={{ width: "auto", height: "40px", borderRadius: "6px" }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">Category (All)</option>
                  {categories.map((cat: any) => {
                    const catName =
                      cat.categoryName || cat.name || cat.category;
                    return (
                      <option key={cat._id} value={catName}>
                        {catName}
                      </option>
                    );
                  })}
                </select>

                <select
                  className="form-select text-muted"
                  style={{ width: "auto", height: "40px", borderRadius: "6px" }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">Status</option>
                  <option value="Active">Active</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">
                  Loading expenses from database...
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

      {/* ── Add Expense Modal ── */}
      <div
        className="modal fade"
        id="add-expense-modal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">Add New Expense</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeBtnRef}
              />
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Expense Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Office Stationery"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {categories.length === 0 ? (
                        <option value="General">General</option>
                      ) : (
                        categories.map((cat: any) => {
                          const catName =
                            cat.categoryName || cat.name || cat.category;
                          return (
                            <option key={cat._id} value={catName}>
                              {catName}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Amount ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 250"
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Description - REQUIRED FIELD */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Enter description"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: "#ff6f28", borderColor: "#ff6f28" }}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Create Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesList;
