import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import ExpenseService from "../services/expense.service";
import apiClient from "../services/api.service";
import moment from "moment";
// @ts-ignore
import html2pdf from "html2pdf.js";

const ExpensesList = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

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

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

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
        description: formData.description.trim(),
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
        fetchExpenses();
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

  // Export to Excel / CSV
  const handleExcelExport = () => {
    if (!listData || listData.length === 0) {
      alert("No expense records found to export.");
      return;
    }
    const headers = [
      "Reference",
      "Expense Name",
      "Category",
      "Description",
      "Date",
      "Amount",
      "Status",
    ];
    const rowsList = listData.map((item: any) => [
      `"${item.reference || ""}"`,
      `"${(item.title || item.expenseName || "").replace(/"/g, '""')}"`,
      `"${item.category || ""}"`,
      `"${(item.description || "").replace(/"/g, '""')}"`,
      `"${item.date || item.createdAt ? moment(item.date || item.createdAt).format("DD MMM YYYY") : "-"}"`,
      `"${Number(item.amount || 0).toFixed(2)}"`,
      `"${item.status || "Active"}"`,
    ]);
    const csvContent = [
      headers.join(","),
      ...rowsList.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Expense_List_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const handlePdfExport = async () => {
    if (!listData || listData.length === 0) {
      alert("No expense records found to export.");
      return;
    }
    const rowsHtml = listData
      .map(
        (item: any, idx: number) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;">${idx + 1}</td>
          <td style="padding: 8px; font-weight: bold; color: #ff6f28;">${item.reference || "-"}</td>
          <td style="padding: 8px;">${item.title || item.expenseName || "-"}</td>
          <td style="padding: 8px;">${item.category || "-"}</td>
          <td style="padding: 8px;">${item.description || "-"}</td>
          <td style="padding: 8px;">${item.date || item.createdAt ? moment(item.date || item.createdAt).format("DD MMM YYYY") : "-"}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #dc3545;">$${Number(item.amount || 0).toFixed(2)}</td>
          <td style="padding: 8px;">${item.status || "Active"}</td>
        </tr>
      `,
      )
      .join("");

    const total = listData.reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0,
    );

    const tempDiv = document.createElement("div");
    tempDiv.style.padding = "24px";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ff6f28;padding-bottom:12px;margin-bottom:18px;">
        <div>
          <h2 style="margin:0;color:#333;">DreamsPOS</h2>
          <p style="margin:4px 0 0;color:#ff6f28;font-weight:bold;">Expenses Report</p>
          <p style="margin:2px 0 0;color:#777;font-size:11px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:8px 14px;text-align:right;">
          <p style="margin:0;font-size:11px;color:#6c757d;">Total Expense</p>
          <h3 style="margin:2px 0 0;color:#dc3545;">$${total.toFixed(2)}</h3>
          <p style="margin:2px 0 0;font-size:10px;color:#6c757d;">${listData.length} Records</p>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#ff6f28;color:white;">
            <th style="padding:10px 8px;text-align:left;">#</th>
            <th style="padding:10px 8px;text-align:left;">Reference</th>
            <th style="padding:10px 8px;text-align:left;">Expense Name</th>
            <th style="padding:10px 8px;text-align:left;">Category</th>
            <th style="padding:10px 8px;text-align:left;">Description</th>
            <th style="padding:10px 8px;text-align:left;">Date</th>
            <th style="padding:10px 8px;text-align:right;">Amount</th>
            <th style="padding:10px 8px;text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
    document.body.appendChild(tempDiv);
    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: `Expenses_Report_${new Date().toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(tempDiv)
        .save();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const columns = [
    {
      header: "Reference",
      field: "reference",
      body: (data: any) => (
        <span className="badge bg-soft-primary text-primary">
          {data.reference || "-"}
        </span>
      ),
    },
    {
      header: "Expense Name",
      field: "title",
      body: (data: any) => <span>{data.title || data.expenseName || "-"}</span>,
    },
    {
      header: "Category",
      field: "category",
      body: (data: any) => <span>{data.category || "-"}</span>,
    },
    {
      header: "Description",
      field: "description",
      body: (data: any) => <span>{data.description || "-"}</span>,
    },
    {
      header: "Date",
      field: "date",
      body: (data: any) => (
        <span>
          {data.date || data.createdAt
            ? moment(data.date || data.createdAt).format("DD MMM YYYY")
            : "-"}
        </span>
      ),
    },
    {
      header: "Amount",
      field: "amount",
      body: (data: any) => (
        <span className="fw-semibold text-danger">
          ${Number(data.amount || 0).toFixed(2)}
        </span>
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
                ? "badge-linesuccess"
                : "badge-linedanger"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Action",
      field: "actions",
      body: (data: any) => (
        <div className="edit-delete-action">
          <Link
            className="confirm-text p-2 mb-0"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDelete(data._id);
            }}
          >
            <i className="ti ti-trash text-danger" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Expenses</h4>
                <h6>Manage Your Expenses</h6>
              </div>
            </div>
            <TableTopHead
              onPdfExport={handlePdfExport}
              onExcelExport={handleExcelExport}
            />
            <div className="page-btn">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add-expense-modal"
                className="btn btn-primary"
              >
                <i className="feather icon-plus-circle me-2" />
                Add New
              </Link>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
            </div>
            <div className="card-body pb-0">
              <div className="table-responsive">
                {loading ? (
                  <div className="p-4 text-center">
                    Loading from database...
                  </div>
                ) : (
                  <PrimeDataTable
                    column={columns}
                    data={listData}
                    totalRecords={listData.length}
                    rows={rows}
                    setRows={setRows}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    selectionMode="checkbox"
                    selection={selectedItems}
                    onSelectionChange={(e: any) => setSelectedItems(e.value)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <div className="modal fade" id="add-expense-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Expense</h4>
                  </div>
                  <button
                    type="button"
                    className="close btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    ref={closeBtnRef}
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddSubmit}>
                    <div className="row">
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Expense Name{" "}
                          <span className="text-danger ms-1">*</span>
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

                      <div className="col-lg-6 mb-3">
                        <label className="form-label">
                          Category <span className="text-danger ms-1">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
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

                      <div className="col-lg-6 mb-3">
                        <label className="form-label">
                          Amount ($) <span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 250"
                          required
                          min="0"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Status</label>
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

                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Description{" "}
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="Enter description"
                          required
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="modal-footer mt-4 pe-0 pb-0">
                      <button
                        type="button"
                        className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary fs-13 fw-medium p-2 px-3"
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
        </div>
      </div>
    </>
  );
};

export default ExpensesList;
