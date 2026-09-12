import { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { Link } from "react-router-dom";
import CommonFooter from "../../../components/footer/commonFooter";

import PrimeDataTable from "../../../components/data-table";
import { company01 } from "../../../utils/imagepath";
import SearchFromApi from "../../../components/data-table/search";
import DeleteModal from "../../../components/delete-modal";
import { StoreService } from "../../services/store.service";
import TooltipIcons from "../../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../../components/tooltip-content/refresh";
import CollapesIcon from "../../../components/tooltip-content/collapes";
const Domain = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<any>(0);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [filterPlanType, setFilterPlanType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSort, setFilterSort] = useState<string>("Recently Added");

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await StoreService.getStores();
      if (res.status && res.data) {
        setListData(res.data);
        setTotalRecords(res.data.length);
      }
    } catch (error) {
      console.error("Error loading store domains:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const filteredData = listData.filter((item) => {
    let match = true;
    if (filterPlanType) {
      match = match && ((item.planType || "Monthly") === filterPlanType);
    }
    if (filterStatus) {
      const mappedStatus = item.status === "Active" ? "Approved" : "Pending";
      match = match && (mappedStatus === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.username && item.username.toLowerCase().includes(q))
      );
    }
    return match;
  }).sort((a, b) => {
    if (filterSort === "Ascending") return a.name?.localeCompare(b.name);
    if (filterSort === "Descending" || filterSort === "Desending") return b.name?.localeCompare(a.name);
    if (filterSort === "Last Month") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (filterSort === "Last 7 Days") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const columns = [
    {
      header: "Name",
      field: "name",
      key: "name",
      body: (row: any) => {
        const imgSrc = row.avatar
          ? (row.avatar.startsWith("http") ? row.avatar : `${BACKEND_URL}${row.avatar}`)
          : company01;
        return (
          <div className="d-flex align-items-center file-name-icon">
            <Link to="#" className="avatar avatar-md border rounded-circle">
              <img src={imgSrc} className="img-fluid" alt="img" style={{ width: 40, height: 40, objectFit: "cover" }} />
            </Link>
            <div className="ms-2">
              <h6 className="fw-medium">
                <Link to="#">{row.name || "Unnamed Store"}</Link>
              </h6>
            </div>
          </div>
        );
      },
    },
    {
      header: "Domain URL",
      field: "username",
      key: "username",
      body: (row: any) => (
        <span>{row.website || row.username || "N/A"}</span>
      ),
    },
    {
      header: "Plan",
      field: "plan",
      key: "plan",
      body: (row: any) => <span>{row.plan || "N/A"}</span>,
    },
    {
      header: "Created Date",
      field: "createdAt",
      key: "createdAt",
      body: (row: any) => (
        <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "N/A"}</span>
      ),
    },
    {
      header: "Status",
      field: "status",
      key: "status",
      body: (row: any) => {
        let badgeClass = "";
        let icon: any = "";
        const status = row.status === "Active" ? "Approved" : "Pending";
        if (status === "Approved") {
          badgeClass = "badge-soft-success";
          icon = <i className="ti ti-checks me-1"></i>;
        } else if (status === "Pending") {
          badgeClass = "badge-soft-skyblue";
          icon = <i className="ti ti-clock me-1"></i>;
        } else {
          badgeClass = "badge-soft-danger";
          icon = <i className="ti ti-x me-1"></i>;
        }
        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
            {icon}
            {status}
          </span>
        );
      },
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="action-icon d-inline-flex align-items-center">
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded me-2"
            data-bs-toggle="modal"
            data-bs-target={
              row.status === "Approved"
                ? "#domain_approved"
                : row.status === "Pending"
                  ? "#domain_pending"
                  : "#domain_rejected"
            }
          >
            <i className="ti ti-eye"></i>
          </Link>
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded"
             data-bs-toggle="modal" data-bs-target="#delete-modal"
          >
            <i className="ti ti-trash"></i>
          </Link>
        </div>
      ),
    },
  ];
  const exportToExcel = () => {
    const data = filteredData || listData || [];
    if (data.length === 0) return;
    const csvData = data.map(item => ({
      "Name": item.name || "Unnamed Store",
      "Domain URL": item.website || item.username || "N/A",
      "Plan": item.plan || "N/A",
      "Created Date": item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "N/A",
      "Status": item.status === "Active" ? "Approved" : "Pending",
    }));
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(obj => Object.values(obj).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "domains.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const element = document.querySelector('.table-responsive') as HTMLElement;
    if (element) {
      html2pdf().from(element).save('domains.pdf');
    }
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Domain</h4>
                <h6>Manage your domain</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons onPdfClick={exportToPDF} onExcelClick={exportToExcel} />
              <RefreshIcon onClick={fetchDomains} />
              <CollapesIcon />
            </ul>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {filterPlanType || "Select Plan Type"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlanType("Monthly")}>
                        Monthly
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlanType("Yearly")}>
                        Yearly
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlanType(null)}>
                        All
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Approved")}>
                        Approved
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Pending")}>
                        Pending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Rejected")}>
                        Rejected
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {filterSort}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterSort("Recently Added")}>
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterSort("Ascending")}>
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterSort("Descending")}>
                        Descending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterSort("Last Month")}>
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterSort("Last 7 Days")}>
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
      {/* /Page Wrapper */}
      {/* Domain Details */}
      <div className="modal fade" id="domain_approved">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Detail
                <span className="badge bg-outline-success d-inline-flex align-items-center badge-xs ms-2">
                  <i className="ti ti-point-filled" />
                  Approved
                </span>
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="p-3 mb-3 br-5 bg-transparent-light">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="d-flex align-items-center file-name-icon">
                              <Link
                                to="#"
                                className="avatar avatar-md border avatar-rounded"
                              >
                                <img
                                  src={company01}
                                  className="img-fluid"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium fs-14">
                                  <Link to="#">BrightWave Innovations</Link>
                                </h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Name</span>
                      <h6 className="fw-normal">Advanced</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Type</span>
                      <h6 className="fw-normal">Monthly</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Account URL</span>
                      <h6 className="fw-normal">bwi.example.com</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Price</span>
                      <h6 className="fw-normal">200</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Register Date</span>
                      <h6 className="fw-normal">12 Sep 2024</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Expiring On</span>
                      <h6 className="fw-normal">11 Oct 2024</h6>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Domain Details */}
      {/* Domain Details */}
      <div className="modal fade" id="domain_pending">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Detail
                <span className="badge bg-outline-skyblue d-inline-flex align-items-center badge-xs ms-2">
                  <i className="ti ti-point-filled" />
                  Pending
                </span>
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="p-3 mb-3 br-5 bg-transparent-light">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center file-name-icon">
                              <Link
                                to="#"
                                className="avatar avatar-md border avatar-rounded"
                              >
                                <img
                                  src={company01}
                                  className="img-fluid"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium fs-14">
                                  <Link to="#">BrightWave Innovations</Link>
                                </h6>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 text-end">
                            <span className="badge badge-success d-inline-flex align-items-center badge-xs ms-2">
                              <i className="ti ti-check me-1" />
                              Approve
                            </span>
                            <span className="badge badge-danger d-inline-flex align-items-center badge-xs ms-2">
                              <i className="ti ti-x me-1" />
                              Reject
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Name</span>
                      <h6 className="fw-normal">Advanced</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Type</span>
                      <h6 className="fw-normal">Monthly</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Account URL</span>
                      <h6 className="fw-normal">bwi.example.com</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Price</span>
                      <h6 className="fw-normal">200</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Register Date</span>
                      <h6 className="fw-normal">12 Sep 2024</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Expiring On</span>
                      <h6 className="fw-normal">11 Oct 2024</h6>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Domain Details */}
      {/* Domain Details */}
      <div className="modal fade" id="domain_rejected">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Detail
                <span className="badge bg-outline-danger d-inline-flex align-items-center badge-xs ms-2">
                  <i className="ti ti-point-filled" />
                  Rejected
                </span>
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="p-3 mb-3 br-5 bg-transparent-light">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="d-flex align-items-center file-name-icon">
                              <Link
                                to="#"
                                className="avatar avatar-md border avatar-rounded"
                              >
                                <img
                                  src={company01}
                                  className="img-fluid"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium fs-14">
                                  <Link to="#">BrightWave Innovations</Link>
                                </h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Name</span>
                      <h6 className="fw-normal">Advanced</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Type</span>
                      <h6 className="fw-normal">Monthly</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Account URL</span>
                      <h6 className="fw-normal">bwi.example.com</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Price</span>
                      <h6 className="fw-normal">200</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Register Date</span>
                      <h6 className="fw-normal">12 Sep 2024</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Expiring On</span>
                      <h6 className="fw-normal">11 Oct 2024</h6>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Domain Details */}
    <DeleteModal />
    </>
  );
};

export default Domain;
