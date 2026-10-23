import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import ExpenseCategoryService, {
  type ExpenseCategoryItem,
} from "../services/expense-category.service";
import moment from "moment";
// @ts-ignore
import html2pdf from "html2pdf.js";

const ExpenseCategory = () => {
  const [data, setData] = useState<ExpenseCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

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

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

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
        const closeBtn = document.querySelector(
          "#add-units .btn-close, #add-category .btn-close, .modal .btn-close",
        ) as HTMLElement;
        closeBtn?.click();

        setCategoryName("");
        setDescription("");
        setStatus("Active");

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

  // Export to Excel / CSV
  const handleExcelExport = () => {
    if (!data || data.length === 0) {
      alert("No category records found to export.");
      return;
    }
    const headers = ["#", "Category Name", "Description", "Status", "Added Date"];
    const rowsList = data.map((item: any, idx: number) => [
      idx + 1,
      `"${item.categoryName || item.name || ""}"`,
      `"${(item.description || "").replace(/"/g, '""')}"`,
      `"${item.status || "Active"}"`,
      `"${item.createdAt ? moment(item.createdAt).format("DD MMM YYYY") : "-"}"`,
    ]);
    const csvContent = [headers.join(","), ...rowsList.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expense_Category_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const handlePdfExport = async () => {
    if (!data || data.length === 0) {
      alert("No category records found to export.");
      return;
    }
    const rowsHtml = data
      .map(
        (item: any, idx: number) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px 8px;">${idx + 1}</td>
          <td style="padding: 10px 8px; font-weight: bold;">${item.categoryName || item.name || "-"}</td>
          <td style="padding: 10px 8px;">${item.description || "-"}</td>
          <td style="padding: 10px 8px;">${item.status || "Active"}</td>
          <td style="padding: 10px 8px;">${item.createdAt ? moment(item.createdAt).format("DD MMM YYYY") : "-"}</td>
        </tr>
      `
      )
      .join("");

    const tempDiv = document.createElement("div");
    tempDiv.style.padding = "24px";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ff6f28;padding-bottom:12px;margin-bottom:18px;">
        <div>
          <h2 style="margin:0;color:#333;">DreamsPOS</h2>
          <p style="margin:4px 0 0;color:#ff6f28;font-weight:bold;">Expense Category Report</p>
          <p style="margin:2px 0 0;color:#777;font-size:11px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:8px 14px;text-align:right;">
          <p style="margin:0;font-size:11px;color:#6c757d;">Total Categories</p>
          <h3 style="margin:2px 0 0;color:#ff6f28;">${data.length}</h3>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#ff6f28;color:white;">
            <th style="padding:10px 8px;text-align:left;">#</th>
            <th style="padding:10px 8px;text-align:left;">Category Name</th>
            <th style="padding:10px 8px;text-align:left;">Description</th>
            <th style="padding:10px 8px;text-align:left;">Status</th>
            <th style="padding:10px 8px;text-align:left;">Added Date</th>
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
          filename: `Expense_Category_Report_${new Date().toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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
      header: "Category Name",
      field: "categoryName",
      body: (row: any) => (
        <span className="fw-semibold">{row.categoryName || row.name}</span>
      ),
    },
    {
      header: "Description",
      field: "description",
      body: (row: any) => <span>{row.description || "-"}</span>,
    },
    {
      header: "Status",
      field: "status",
      body: (row: any) => (
        <span
          className={`badge ${
            (row.status || "Active") === "Active"
              ? "badge-linesuccess"
              : "badge-linedanger"
          }`}
        >
          {row.status || "Active"}
        </span>
      ),
    },
    {
      header: "Added Date",
      field: "createdAt",
      body: (rowData: any) =>
        rowData.createdAt ? moment(rowData.createdAt).format("DD MMM YYYY") : "-",
    },
    {
      header: "Action",
      field: "actions",
      body: (row: any) => (
        <div className="edit-delete-action">
          <Link
            className="confirm-text p-2 mb-0"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDelete(row._id);
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
                <h4>Expense Category</h4>
                <h6>Manage your Expense Categories</h6>
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
                data-bs-target="#add-units"
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
                  <div className="p-4 text-center">Loading from database...</div>
                ) : (
                  <PrimeDataTable
                    column={columns}
                    data={data}
                    totalRecords={data.length}
                    rows={rows}
                    setRows={setRows}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    selectionMode="checkbox"
                    selection={selectedProducts}
                    onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Expense Category</h4>
                  </div>
                  <button
                    type="button"
                    className="close btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddCategory}>
                    <div className="row">
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Category Name
                          <span className="text-danger ms-1">*</span>
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
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Enter description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">Status</label>
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
                        {submitting ? "Adding..." : "Add Category"}
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

export default ExpenseCategory;
