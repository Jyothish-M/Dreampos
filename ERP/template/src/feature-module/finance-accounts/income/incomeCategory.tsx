import { Link } from "react-router-dom";
import PrimeDataTable from "../../../components/data-table";
import TableTopHead from "../../../components/table-top-head";
import SearchFromApi from "../../../components/data-table/search";
import { useState, useEffect } from "react";
import apiClient from "../../services/api.service";
import moment from "moment";

const IncomeCategory = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);

  // DataTable states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/income-categories");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setListData(data);
      }
    } catch (error) {
      console.error("Failed to fetch income categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Please enter a category name");

    try {
      setSubmitting(true);
      await apiClient.post("/income-categories", formData);
      alert("Income Category added successfully!");
      setFormData({ name: "" });
      
      // Close modal hack for bootstrap 5
      const closeBtn = document.querySelector("#add-units .btn-close, #add-units [data-bs-dismiss='modal']") as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      
      fetchCategories();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await apiClient.delete(`/income-categories/${id}`);
        alert("Income Category deleted successfully!");
        fetchCategories();
      } catch (error) {
        alert("Failed to delete category");
      }
    }
  };

  const columns = [
    {
      header: "Category Name",
      field: "name",
    },
    {
      header: "Status",
      field: "status",
      body: (rowData: any) => (
        <span className={`badge ${rowData.status === "Active" ? "badge-linesuccess" : "badge-linedanger"}`}>
          {rowData.status || "Active"}
        </span>
      ),
    },
    {
      header: "Added Date",
      field: "createdAt",
      body: (rowData: any) => rowData.createdAt ? moment(rowData.createdAt).format("DD MMM YYYY") : "-",
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
                <h4>Income Category</h4>
                <h6>Manage your Income Categories</h6>
              </div>
            </div>
            <TableTopHead />
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
                    data={listData}
                    totalRecords={listData.length}
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
                    <h4>Add Income Category</h4>
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
                  <form onSubmit={handleAddSubmit}>
                    <div className="row">
                      <div className="col-lg-12">
                        <label className="form-label">
                          Category Name
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Foreign investment"
                          value={formData.name}
                          onChange={(e) => setFormData({ name: e.target.value })}
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

export default IncomeCategory;
