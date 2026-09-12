import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { VariantAttributeService } from "../services/variantattribute.service";
import type { VariantAttribute } from "../services/variantattribute.service";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";

const VariantAttributes: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<VariantAttribute[]>([]);
  const [dataSource, setDataSource] = useState<VariantAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");

  // Edit state
  const [selectedItem, setSelectedItem] = useState<VariantAttribute | null>(null);

  // Add form state
  const [addVariant, setAddVariant] = useState("");
  const [addValues, setAddValues] = useState("");
  const [addStatus, setAddStatus] = useState<"Active" | "Inactive">("Active");
  const [addLoading, setAddLoading] = useState(false);

  // Edit form state
  const [editVariant, setEditVariant] = useState("");
  const [editValues, setEditValues] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await VariantAttributeService.getAll({ page: 1, limit: 1000 });
      if (response.status) {
        setDataSource(response.data);
      }
    } catch (error) {
      console.error("Error fetching variant attributes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filter
  const filteredData = dataSource.filter((item) => {
    const statusOk = statusFilter === "All" || item.status === statusFilter;
    const searchOk = !searchQuery ||
      item.variant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.values?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusOk && searchOk;
  });

  const handleConfirmDelete = async () => {
    if (deleteType === "single" && deleteId) {
      try {
        await VariantAttributeService.delete(deleteId);
        fetchData();
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting:", error);
      }
    } else if (deleteType === "bulk" && selectedItems.length > 0) {
      try {
        const ids = selectedItems.map((i) => i.id as string);
        await VariantAttributeService.bulkDelete(ids);
        fetchData();
        setSelectedItems([]);
      } catch (error) {
        console.error("Error bulk deleting:", error);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVariant || !addValues) {
      alert("Variant and Values are required!");
      return;
    }
    setAddLoading(true);
    try {
      await VariantAttributeService.create({ variant: addVariant, values: addValues, status: addStatus });
      setAddVariant("");
      setAddValues("");
      setAddStatus("Active");
      document.getElementById("close-add-modal")?.click();
      fetchData();
    } catch (error: any) {
      console.error("Error creating:", error);
      alert(error?.response?.data?.message || "Failed to create. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (item: VariantAttribute) => {
    setSelectedItem(item);
    setEditVariant(item.variant);
    setEditValues(item.values);
    setEditStatus(item.status);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.id) return;
    setEditLoading(true);
    try {
      await VariantAttributeService.update(selectedItem.id, { variant: editVariant, values: editValues, status: editStatus });
      document.getElementById("close-edit-modal")?.click();
      fetchData();
    } catch (error: any) {
      console.error("Error updating:", error);
      alert(error?.response?.data?.message || "Failed to update. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const columns = [
    {
      field: "variant",
      header: "Variant",
      key: "variant",
      sortable: true,
      body: (data: VariantAttribute) => (
        <span className="fw-medium text-dark">{data.variant}</span>
      ),
    },
    {
      field: "values",
      header: "Values",
      key: "values",
      sortable: true,
    },
    {
      field: "createdon",
      header: "Created On",
      key: "createdon",
      sortable: true,
      body: (data: VariantAttribute) => (
        <span>{data.createdon || data.createdAt || "-"}</span>
      ),
    },
    {
      field: "status",
      header: "Status",
      key: "status",
      sortable: true,
      body: (rowData: VariantAttribute) => (
        <span
          className={`badge ${rowData.status === "Active" ? "bg-success" : "bg-danger"} fw-medium fs-10`}
          style={{ width: "80px", textAlign: "center", display: "inline-block" }}
        >
          {rowData.status}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: VariantAttribute) => (
        <div className="edit-delete-action d-flex align-items-center justify-content-end">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-variant"
            onClick={() => openEdit(row)}
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => {
              setDeleteId(row.id as string);
              setDeleteType("single");
            }}
          >
            <i className="feather icon-trash-2"></i>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Variant Attributes</h4>
              <h6>Manage your variant attributes</h6>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <ul className="table-top-head">
              <TooltipIcons
                onPdfClick={() => VariantAttributeService.exportData('pdf')}
                onExcelClick={() => VariantAttributeService.exportData('xlsx')}
              />
              <RefreshIcon onClick={fetchData} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-variant"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Variant
              </Link>
            </div>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <SearchFromApi
              callback={(v: any) => {
                setSearchQuery(v);
                setCurrentPage(1);
              }}
              rows={rows}
              setRows={setRows}
            />
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              {selectedItems.length > 0 && (
                <div className="d-flex align-items-center me-2">
                  <button
                    className="btn btn-danger btn-sm me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#delete-modal"
                    onClick={() => setDeleteType("bulk")}
                  >
                    Bulk Delete ({selectedItems.length})
                  </button>
                </div>
              )}
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status: {statusFilter}
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {(["All", "Active", "Inactive"] as const).map((s) => (
                    <li key={s}>
                      <button className="dropdown-item rounded-1" onClick={() => setStatusFilter(s)}>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted small">Loading...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredData.length}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedItems}
                  onSelectionChange={(e: any) => setSelectedItems(e.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <CommonFooter />

      {/* Add Modal */}
      <div className="modal fade" id="add-variant" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Add Variant Attribute</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    id="close-add-modal"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form onSubmit={handleAddSubmit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Variant Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Size, Color"
                        value={addVariant}
                        onChange={(e) => setAddVariant(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Values<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. S, M, L, XL"
                        value={addValues}
                        onChange={(e) => setAddValues(e.target.value)}
                        required
                      />
                      <small className="text-muted">Enter values separated by comma</small>
                    </div>
                    <div className="mb-0 mt-3">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="add_status"
                          className="check"
                          checked={addStatus === "Active"}
                          onChange={(e) => setAddStatus(e.target.checked ? "Active" : "Inactive")}
                        />
                        <label htmlFor="add_status" className="checktoggle" />
                      </div>
                    </div>
                    <div className="modal-footer border-0 px-0 pb-0 mt-4">
                      <button
                        type="button"
                        className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary fs-13 fw-medium p-2 px-3" disabled={addLoading}>
                        {addLoading ? "Adding..." : "Add Variant"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-variant" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Edit Variant Attribute</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    id="close-edit-modal"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form onSubmit={handleEditSubmit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Variant Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editVariant}
                        onChange={(e) => setEditVariant(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Values<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editValues}
                        onChange={(e) => setEditValues(e.target.value)}
                        required
                      />
                      <small className="text-muted">Enter values separated by comma</small>
                    </div>
                    <div className="mb-0 mt-3">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="edit_status"
                          className="check"
                          checked={editStatus === "Active"}
                          onChange={(e) => setEditStatus(e.target.checked ? "Active" : "Inactive")}
                        />
                        <label htmlFor="edit_status" className="checktoggle" />
                      </div>
                    </div>
                    <div className="modal-footer border-0 px-0 pb-0 mt-4">
                      <button
                        type="button"
                        className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary fs-13 fw-medium p-2 px-3" disabled={editLoading}>
                        {editLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default VariantAttributes;
