import { Link } from "react-router-dom";
import PrimeDataTable from "../../../components/data-table";
import TableTopHead from "../../../components/table-top-head";
import SearchFromApi from "../../../components/data-table/search";
import { useState, useEffect } from "react";
import apiClient from "../../services/api.service";
import moment from "moment";
// @ts-ignore
import html2pdf from "html2pdf.js";

const IncomeList = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    store: "",
    category: "",
    notes: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  // DataTable states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

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

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      const closeBtn = document.querySelector(
        "#add-income-modal .btn-close, #add-income-modal [data-bs-dismiss='modal']"
      ) as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      fetchIncomes();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to add income.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this income?")) {
      try {
        await apiClient.delete(`/incomes/${id}`);
        alert("Income deleted successfully!");
        fetchIncomes();
      } catch (error) {
        alert("Failed to delete income.");
      }
    }
  };

  // Export to Excel / CSV
  const handleExcelExport = () => {
    if (!listData || listData.length === 0) {
      alert("No income records found to export.");
      return;
    }
    const headers = ["Date", "Reference", "Store", "Category", "Notes", "Amount"];
    const rows = listData.map((item: any) => [
      `"${item.date ? moment(item.date).format("DD MMM YYYY") : "-"}"`,
      `"${item.reference || ""}"`,
      `"${item.store || ""}"`,
      `"${item.category || ""}"`,
      `"${(item.notes || "").replace(/"/g, '""')}"`,
      `"${Number(item.amount || 0).toFixed(2)}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Income_List_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const handlePdfExport = async () => {
    if (!listData || listData.length === 0) {
      alert("No income records found to export.");
      return;
    }
    const rowsHtml = listData
      .map(
        (item: any, idx: number) => `
        <tr style="border-bottom:1px solid #ddd;">
          <td style="padding:8px;">${idx + 1}</td>
          <td style="padding:8px;">${item.date ? moment(item.date).format("DD MMM YYYY") : "-"}</td>
          <td style="padding:8px;font-weight:bold;color:#fe9f43;">${item.reference || "-"}</td>
          <td style="padding:8px;">${item.store || "-"}</td>
          <td style="padding:8px;">${item.category || "-"}</td>
          <td style="padding:8px;">${item.notes || "-"}</td>
          <td style="padding:8px;text-align:right;font-weight:bold;color:#28a745;">$${Number(item.amount || 0).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const total = listData.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

    const tempDiv = document.createElement("div");
    tempDiv.style.padding = "24px";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #fe9f43;padding-bottom:12px;margin-bottom:18px;">
        <div>
          <h2 style="margin:0;color:#333;">DreamsPOS</h2>
          <p style="margin:4px 0 0;color:#fe9f43;font-weight:bold;">Income List Report</p>
          <p style="margin:2px 0 0;color:#777;font-size:11px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:8px 14px;text-align:right;">
          <p style="margin:0;font-size:11px;color:#6c757d;">Total Income</p>
          <h3 style="margin:2px 0 0;color:#28a745;">$${total.toFixed(2)}</h3>
          <p style="margin:2px 0 0;font-size:10px;color:#6c757d;">${listData.length} Records</p>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#fe9f43;color:white;">
            <th style="padding:10px 8px;text-align:left;">#</th>
            <th style="padding:10px 8px;text-align:left;">Date</th>
            <th style="padding:10px 8px;text-align:left;">Reference</th>
            <th style="padding:10px 8px;text-align:left;">Store</th>
            <th style="padding:10px 8px;text-align:left;">Category</th>
            <th style="padding:10px 8px;text-align:left;">Notes</th>
            <th style="padding:10px 8px;text-align:right;">Amount</th>
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
          filename: `Income_Report_${new Date().toISOString().split("T")[0]}.pdf`,
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
      header: "Date",
      field: "date",
      body: (rowData: any) =>
        rowData.date ? moment(rowData.date).format("DD MMM YYYY") : "-",
    },
    {
      header: "Reference",
      field: "reference",
      body: (rowData: any) => (
        <span className="badge bg-soft-primary text-primary">
          {rowData.reference || "-"}
        </span>
      ),
    },
    {
      header: "Store",
      field: "store",
    },
    {
      header: "Category",
      field: "category",
    },
    {
      header: "Notes",
      field: "notes",
    },
    {
      header: "Amount",
      field: "amount",
      body: (rowData: any) => (
        <span className="fw-semibold text-success">
          ${Number(rowData.amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Action",
      field: "actions",
      body: (rowData: any) => (
        <div className="edit-delete-action">
          <Link
            className="confirm-text p-2 mb-0"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDelete(rowData._id);
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
                <h4>Income</h4>
                <h6>Manage your income records</h6>
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
                data-bs-target="#add-income-modal"
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

      {/* Add Income Modal */}
      <div className="modal fade" id="add-income-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Income</h4>
                  </div>
                  <button
                    type="button"
                    className="close btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Date <span className="text-danger ms-1">*</span>
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
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Store <span className="text-danger ms-1">*</span>
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
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Category <span className="text-danger ms-1">*</span>
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
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Notes <span className="text-danger ms-1">*</span>
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
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Amount ($) <span className="text-danger ms-1">*</span>
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
                        {submitting ? "Saving..." : "Save Income"}
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

export default IncomeList;
