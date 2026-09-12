import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import PrimeDataTable from "../../../components/data-table";
import SearchFromApi from "../../../components/data-table/search";
import CommonFooter from '../../../components/footer/commonFooter';
import TooltipIcons from '../../../components/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../components/tooltip-content/refresh';
import CollapesIcon from '../../../components/tooltip-content/collapes';
import { StoreService } from '../../services/store.service';
import { PackageService } from '../../services/package.service';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';

const Packages = () => {
  const [data, setData] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSort, setFilterSort] = useState<string>("Recently Added");
  const [newPackage, setNewPackage] = useState({
    name: "Basic",
    type: "Monthly",
    price: 0,
    status: "Active",
    modules: [] as string[]
  });
  const [editPackage, setEditPackage] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const modulesList = [
    "Employees", "Invoices", "Reports", "Contacts", "Clients", 
    "Estimates", "Goals", "Deals", "Projects", "Payments", 
    "Assets", "Leads", "Tickets", "Taxes", "Activities", "Pipelines"
  ];

  const isAllSelected = (pkg: any) => pkg?.modules?.length === modulesList.length;

  const toggleAllModules = (isEdit: boolean) => {
    if (isEdit) {
      if (isAllSelected(editPackage)) {
        setEditPackage({ ...editPackage, modules: [] });
      } else {
        setEditPackage({ ...editPackage, modules: [...modulesList] });
      }
    } else {
      if (isAllSelected(newPackage)) {
        setNewPackage({ ...newPackage, modules: [] });
      } else {
        setNewPackage({ ...newPackage, modules: [...modulesList] });
      }
    }
  };

  const toggleModule = (isEdit: boolean, mod: string) => {
    if (isEdit) {
      const current = editPackage?.modules || [];
      const updated = current.includes(mod) ? current.filter((m: string) => m !== mod) : [...current, mod];
      setEditPackage({ ...editPackage, modules: updated });
    } else {
      const current = newPackage?.modules || [];
      const updated = current.includes(mod) ? current.filter((m: string) => m !== mod) : [...current, mod];
      setNewPackage({ ...newPackage, modules: updated });
    }
  };
  
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const [storesRes, packagesRes] = await Promise.all([
        StoreService.getStores(),
        PackageService.getPackages()
      ]);
      
      if (packagesRes.status && packagesRes.data) {
        const stores = storesRes.status && storesRes.data ? storesRes.data : [];
        const counts = stores.reduce((acc: any, s: any) => {
          const plan = s.plan || "Basic";
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        }, {});
        
        const dynamicPlans = packagesRes.data.map((pkg: any) => ({
          id: pkg._id,
          Plan_Name: pkg.name,
          Plan_Type: pkg.type,
          Total_Subscribers: counts[pkg.name] || 0,
          Price: pkg.price === 0 ? "Free" : `₹${pkg.price}`,
          Created_Date: new Date(pkg.createdAt).toLocaleDateString("en-IN"),
          Status: pkg.status,
          raw: pkg
        }));
        
        setData(dynamicPlans);
      }
    } catch (error) {
      console.error("Error loading stores for packages view:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) => {
    let match = true;
    if (filterStatus) {
      match = match && (item.Status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (
        (item.Plan_Name && item.Plan_Name.toLowerCase().includes(q)) ||
        (item.Plan_Type && item.Plan_Type.toLowerCase().includes(q))
      );
    }
    return match;
  }).sort((a, b) => {
    const dateA = new Date(a.raw?.createdAt || 0).getTime();
    const dateB = new Date(b.raw?.createdAt || 0).getTime();
    
    if (filterSort === "Ascending") return a.Plan_Name?.localeCompare(b.Plan_Name);
    if (filterSort === "Descending" || filterSort === "Desending") return b.Plan_Name?.localeCompare(a.Plan_Name);
    return dateB - dateA;
  });

  useEffect(() => {
    fetchPackages();
  }, []);
  
  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };
  
  const handleAddPackage = async () => {
    try {
      const res = await PackageService.addPackage(newPackage);
      if (res.status) {
        Swal.fire({ title: "Success", text: res.message || "Package added successfully", icon: "success", customClass: { confirmButton: 'btn btn-primary' } });
        setNewPackage({ name: "Basic", type: "Monthly", price: 0, status: "Active", modules: [] });
        fetchPackages();
      } else {
        Swal.fire({ title: "Error", text: res.message || "Failed to add package", icon: "error", customClass: { confirmButton: 'btn btn-primary' } });
      }
    } catch (error: any) {
      Swal.fire({ title: "Error", text: error.response?.data?.message || error.message || "Failed to add package", icon: "error", customClass: { confirmButton: 'btn btn-primary' } });
      console.error("Error adding package:", error);
    }
  };

  const handleUpdatePackage = async () => {
    if (!editPackage) return;
    try {
      const res = await PackageService.updatePackage(editPackage._id, editPackage);
      if (res.status) {
        Swal.fire({ title: "Success", text: res.message || "Package updated successfully", icon: "success", customClass: { confirmButton: 'btn btn-primary' } });
        fetchPackages();
      } else {
        Swal.fire({ title: "Error", text: res.message || "Failed to update package", icon: "error", customClass: { confirmButton: 'btn btn-primary' } });
      }
    } catch (error: any) {
      Swal.fire({ title: "Error", text: error.response?.data?.message || error.message || "Failed to update package", icon: "error", customClass: { confirmButton: 'btn btn-primary' } });
      console.error("Error updating package:", error);
    }
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;
    try {
      const res = await PackageService.deletePackage(selectedPackage._id);
      if (res.status) {
        Swal.fire({ title: "Success", text: res.message || "Package deleted successfully", icon: "success", customClass: { confirmButton: 'btn btn-primary' } });
        fetchPackages();
      } else {
        Swal.fire({ title: "Error", text: res.message || "Failed to delete package", icon: "error", customClass: { confirmButton: 'btn btn-primary' } });
      }
    } catch (error: any) {
      Swal.fire({ title: "Error", text: error.response?.data?.message || error.message || "Failed to delete package", icon: "error", customClass: { confirmButton: 'btn btn-primary' } });
      console.error("Error deleting package:", error);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;
    const csvData = data.map(item => ({
      "Plan Name": item.Plan_Name,
      "Plan Type": item.Plan_Type,
      "Total Subscribers": item.Total_Subscribers,
      "Price": item.Price,
      "Created Date": item.Created_Date,
      "Status": item.Status,
    }));
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(obj => Object.values(obj).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "packages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const element = document.querySelector('.table-responsive') as HTMLElement;
    if (element) {
      html2pdf().from(element).save('packages.pdf');
    }
  };
  
  const columns = [
    {
      header: "Plan Name",
      field: "Plan_Name",
      sortable: true,
      key: "Plan_Name",
      body: (rowData: any) => (
        <h6 className="fw-medium">
          <Link to="#">{rowData.Plan_Name}</Link>
        </h6>
      ),
    },
    {
      header: "Plan Type",
      field: "Plan_Type",
      sortable: true,
      key: "Plan_Type",
    },
    {
      header: "Total Subscribers",
      field: "Total_Subscribers",
      sortable: true,
      key: "Total_Subscribers",
    },
    {
      header: "Price",
      field: "Price",
      sortable: true,
      key: "Price",
    },
    {
      header: "Created Date",
      field: "Created_Date",
      sortable: true,
      key: "Created_Date",
    },
    {
      header: "Status",
      field: "Status",
      sortable: true,
      key: "Status",
      body: (rowData: any) => {
        const status = rowData.Status;
        return (
          <div>
            <span className={`badge ${status === 'Active' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
              <i className="ti ti-point-filled me-1" />
              {status}
            </span>
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      body: (rowData: any) => (
        <div className="action-icon d-inline-flex align-items-center">
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_plans"
            onClick={() => setEditPackage({...rowData.raw})}
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            className="p-2 d-flex align-items-center border rounded"
            onClick={() => setSelectedPackage(rowData.raw)}
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ]

  const planName = [
    { value: "Advanced", label: "Advanced" },
    { value: "Basic", label: "Basic" },
    { value: "Enterprise", label: "Enterprise" },
  ];
  const planType = [
    { value: "Monthly", label: "Monthly" },
    { value: "Yearly", label: "Yearly" },
  ];
  const planPosition = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
  ];
  const plancurrency = [
    { value: "Fixed", label: "Fixed" },
    { value: "Percentage", label: "Percentage" },
  ];
  const discountType = [
    { value: "Fixed", label: "Fixed" },
    { value: "Percentage", label: "Percentage" },
  ];
  const status = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Packages</h4>
                <h6>Manage your packages</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons onPdfClick={exportToPDF} onExcelClick={exportToExcel} />
              <RefreshIcon onClick={fetchPackages} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add_plans"
                className="btn btn-primary"
              >
                <i className='ti ti-circle-plus me-1'></i>
                Add Packages
              </Link>
            </div>
          </div>

          <div className="row">
            {/* Total Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Total Plans
                      </p>
                      <h4>{data.length}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-primary flex-shrink-0">
                      <i className="ti ti-box fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Total Plans */}
            {/* Active Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Active Plans
                      </p>
                      <h4>{data.filter(p => p.Status === "Active").length}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-success flex-shrink-0">
                      <i className="ti ti-activity-heartbeat fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Active Plans */}
            {/* Inactive Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Inactive Plans
                      </p>
                      <h4>{data.filter(p => p.Status !== "Active").length}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-danger flex-shrink-0">
                      <i className="ti ti-player-pause fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Inactive Plans */}
            {/* No of Plans  */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        No of Plan Types
                      </p>
                      <h4>{new Set(data.map(p => p.Plan_Type)).size}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-skyblue flex-shrink-0">
                      <i className="ti ti-mask fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /No of Plans */}
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
                    {filterStatus || "Select Status"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setFilterStatus("Active")}
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setFilterStatus("Inactive")}
                      >
                        Inactive
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setFilterStatus(null)}
                      >
                        All
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
              <div className='table-responsive'>
                <PrimeDataTable
                  column={columns}
                  data={filteredData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={data.length}
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
      {/* Add Plan */}
      <div className="modal fade" id="add_plans">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Plan</h4>
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
                    <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <img
                          src="assets/img/profiles/avatar-30.jpg"
                          alt="img"
                          className="rounded-circle"
                        />
                      </div>
                      <div className="profile-upload">
                        <div className="mb-2">
                          <h6 className="mb-1">Upload Profile Image</h6>
                          <p className="fs-12">Image should be below 4 mb</p>
                        </div>
                        <div className="profile-uploader d-flex align-items-center">
                          <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                            Upload
                            <input
                              type="file"
                              className="form-control image-sign"
                              multiple
                            />
                          </div>
                          <Link
                            to="#"
                            className="btn btn-light btn-sm"
                          >
                            Cancel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Name<span className="text-danger"> *</span>
                      </label>
                      <CreatableSelect
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose or Type"
                        value={newPackage.name ? { value: newPackage.name, label: newPackage.name } : null}
                        onChange={(e: any) => setNewPackage({...newPackage, name: e?.value || ""})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Type<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose"
                        value={planType.find((opt) => opt.value === newPackage.type)}
                        onChange={(e: any) => setNewPackage({...newPackage, type: e.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Position<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planPosition}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Currency<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={plancurrency}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label">
                          Plan Currency<span className="text-danger"> *</span>
                        </label>
                        <span className="text-primary">
                          <i className="fa-solid fa-circle-exclamation me-2" />
                          Set 0 for free
                        </span>
                      </div>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={newPackage.price}
                        onChange={(e) => setNewPackage({...newPackage, price: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount Type<span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <Select
                          classNamePrefix="react-select"
                          options={discountType}
                          placeholder="Choose"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount<span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Limitations Invoices</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Customers</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Product</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Supplier</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6>Plan Modules</h6>
                      <div className="form-check d-flex align-items-center">
                        <label className="form-check-label mt-0 text-dark fw-medium">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={isAllSelected(newPackage)}
                            onChange={() => toggleAllModules(false)}
                          />
                          Select All
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    {modulesList.map((mod) => (
                      <div className="col-lg-3 col-sm-6" key={mod}>
                        <div className="form-check d-flex align-items-center mb-3">
                          <label className="form-check-label mt-0 text-dark fw-medium">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={newPackage?.modules?.includes(mod)}
                              onChange={() => toggleModule(false, mod)}
                            />
                            {mod}
                          </label>
                        </div>
                      </div>
                    ))}

                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <label className="form-check-label mt-0 me-2 text-dark fw-medium">
                          Access Trial
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center gx-3">
                    <div className="col-md-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-fill">
                          <label className="form-label">Trial Days</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="d-block align-items-center ms-3">
                        <label className="form-check-label mt-0 me-2 text-dark">
                          Is Recommended
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Status<span className="text-danger"> *</span>
                        </label>
                        <Select
                          classNamePrefix="react-select"
                          options={status}
                          placeholder="Choose"
                          value={status.find((opt) => opt.value === newPackage.status)}
                          onChange={(e: any) => setNewPackage({...newPackage, status: e.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" defaultValue={""} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  data-bs-dismiss="modal" 
                  className="btn btn-primary" 
                  onClick={handleAddPackage}
                >
                  Add Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Plan */}
      {/* Edit Plan */}
      <div className="modal fade" id="edit_plans">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Plan</h4>
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
                    <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <img
                          src="assets/img/profiles/avatar-30.jpg"
                          alt="img"
                          className="rounded-circle"
                        />
                      </div>
                      <div className="profile-upload">
                        <div className="mb-2">
                          <h6 className="mb-1">Upload Profile Image</h6>
                          <p className="fs-12">Image should be below 4 mb</p>
                        </div>
                        <div className="profile-uploader d-flex align-items-center">
                          <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                            Upload
                            <input
                              type="file"
                              className="form-control image-sign"
                              multiple
                            />
                          </div>
                          <Link
                            to="#"
                            className="btn btn-light btn-sm"
                          >
                            Cancel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Name<span className="text-danger"> *</span>
                      </label>
                      <CreatableSelect
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose or Type"
                        value={editPackage?.name ? { value: editPackage.name, label: editPackage.name } : null}
                        onChange={(e: any) => setEditPackage({...editPackage, name: e?.value || ""})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Type<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose"
                        value={planType.find((opt) => opt.value === editPackage?.type)}
                        onChange={(e: any) => setEditPackage({...editPackage, type: e.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Position<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planPosition}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Currency<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={plancurrency}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label">
                          Plan Currency<span className="text-danger"> *</span>
                        </label>
                        <span className="text-primary">
                          <i className="fa-solid fa-circle-exclamation me-2" />
                          Set 0 for free
                        </span>
                      </div>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={editPackage?.price || 0}
                        onChange={(e) => setEditPackage({...editPackage, price: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount Type<span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <Select
                          classNamePrefix="react-select"
                          options={discountType}
                          placeholder="Choose"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount<span className="text-danger"> *</span>
                      </label>
                      <div className="pass-group">
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Limitations Invoices</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Customers</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Product</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Supplier</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6>Plan Modules</h6>
                      <div className="form-check d-flex align-items-center">
                        <label className="form-check-label mt-0 text-dark fw-medium">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={isAllSelected(editPackage)}
                            onChange={() => toggleAllModules(true)}
                          />
                          Select All
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    {modulesList.map((mod) => (
                      <div className="col-lg-3 col-sm-6" key={mod}>
                        <div className="form-check d-flex align-items-center mb-3">
                          <label className="form-check-label mt-0 text-dark fw-medium">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={editPackage?.modules?.includes(mod)}
                              onChange={() => toggleModule(true, mod)}
                            />
                            {mod}
                          </label>
                        </div>
                      </div>
                    ))}

                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <label className="form-check-label mt-0 me-2 text-dark fw-medium">
                          Access Trial
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center gx-3">
                    <div className="col-md-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-fill">
                          <label className="form-label">Trial Days</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="d-block align-items-center ms-3">
                        <label className="form-check-label mt-0 me-2  text-dark">
                          Is Recommended
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Status<span className="text-danger"> *</span>
                        </label>
                        <Select
                          classNamePrefix="react-select"
                          options={status}
                          placeholder="Choose"
                          value={status.find((opt) => opt.value === editPackage?.status)}
                          onChange={(e: any) => setEditPackage({...editPackage, status: e.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" defaultValue={""} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary" onClick={handleUpdatePackage}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Plan */}
      <>
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="avatar avatar-xl bg-danger-transparent rounded-circle text-danger mb-3">
                  <i className="ti ti-trash-x fs-36" />
                </span>
                <h4 className="mb-1">Confirm Delete</h4>
                <p className="mb-3">
                  You want to delete all the marked items, this cant be undone once
                  you delete.
                </p>
                <div className="d-flex justify-content-center">
                  <Link
                    to="#"
                    className="btn btn-secondary me-3"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link to="#" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleDeletePackage}>
                    Yes, Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
      </>

    </>


  )
}

export default Packages