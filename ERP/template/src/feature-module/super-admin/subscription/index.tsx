import { useState, useEffect } from 'react'
import html2pdf from "html2pdf.js";
import { Link } from 'react-router-dom'
import ReactApexChart from "react-apexcharts";
import PrimeDataTable from "../../../components/data-table";
import SearchFromApi from "../../../components/data-table/search";
import CommonFooter from '../../../components/footer/commonFooter';
import TooltipIcons from '../../../components/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../components/tooltip-content/refresh';
import CollapesIcon from '../../../components/tooltip-content/collapes';
import type { ApexOptions } from 'apexcharts';
import { logo, logoWhite } from '../../../utils/imagepath';
import { InvoiceService } from '../../services/invoice.service';

const Subscription = () => {
  const [data, setData] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [filterPlan, setFilterPlan] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSort, setFilterSort] = useState<string>("Recently Added");

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await InvoiceService.getAllInvoices();
      if (res.status && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Error loading subscription invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);
  
  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };
  
  const filteredData = data.filter((item) => {
    let match = true;
    if (filterPlan) {
      match = match && ((item.plan || "Standard ERP") === filterPlan);
    }
    if (filterStatus) {
      match = match && ((item.paymentStatus || "Unpaid") === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (
        (item.customerName && item.customerName.toLowerCase().includes(q))
      );
    }
    return match;
  }).sort((a, b) => {
    const dateA = new Date(a.invoiceDate || 0).getTime();
    const dateB = new Date(b.invoiceDate || 0).getTime();
    
    if (filterSort === "Ascending") return a.customerName?.localeCompare(b.customerName);
    if (filterSort === "Descending" || filterSort === "Desending") return b.customerName?.localeCompare(a.customerName);
    return dateB - dateA;
  });
  
  const columns = [
    {
      header: "Customer Name",
      field: "customerName",
      sortable: true,
      key: "customerName",
      body: (rowData: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <span className="avatar avatar-md border rounded-circle d-flex align-items-center justify-content-center bg-light">
            <i className="ti ti-user text-muted" />
          </span>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{rowData.customerName || "Walk-in Customer"}</Link>
            </h6>
          </div>
        </div>
      ),
    },
    {
      header: "Plan",
      field: "plan",
      sortable: true,
      key: "plan",
      body: () => <span>Standard ERP</span>,
    },
    {
      header: "Billing Cycle",
      field: "BillCycle",
      sortable: true,
      key: "BillCycle",
      body: () => (
        <span>30 Days</span>
      ),
    },
    {
      header: "Payment Method",
      field: "invoiceType",
      sortable: true,
      key: "invoiceType",
      body: (rowData: any) => (
        <span>{rowData.invoiceType || "Intrastate"}</span>
      ),
    },
    {
      header: "Amount",
      field: "grandTotal",
      sortable: true,
      key: "grandTotal",
      body: (rowData: any) => (
        <span>₹{Math.round(rowData.grandTotal || 0).toLocaleString()}</span>
      ),
    },
    {
      header: "Created Date",
      field: "invoiceDate",
      sortable: true,
      key: "invoiceDate",
      body: (rowData: any) => (
        <span>{rowData.invoiceDate ? new Date(rowData.invoiceDate).toLocaleDateString("en-IN") : "N/A"}</span>
      ),
    },
    {
      header: "Expired On",
      field: "dueDate",
      sortable: true,
      key: "dueDate",
      body: (rowData: any) => (
        <span>{rowData.dueDate ? new Date(rowData.dueDate).toLocaleDateString("en-IN") : "N/A"}</span>
      ),
    },
    {
      header: "Status",
      field: "paymentStatus",
      sortable: true,
      key: "paymentStatus",
      body: (rowData: any) => (
        <span className={`badge ${rowData.paymentStatus === 'Paid' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {rowData.paymentStatus || "Unpaid"}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      sortable: false,
      key: "actions",
      body: () => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2 p-2 d-flex align-items-center border rounded"
            data-bs-toggle="modal"
            data-bs-target="#view_invoice"
          >
            <i className="ti ti-file-invoice" />
          </Link>
          <Link to="#" className="me-2 d-flex align-items-center border rounded p-2">
            <i className="ti ti-download" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            className="d-flex align-items-center p-2 border rounded"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>

      ),
    },
  ]

  const [totalTransaction] = useState<ApexOptions>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#F7A37A"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4,
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#F7A37A"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const [totalSubscription] = useState<ApexOptions>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#70B1FF"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4,
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#70B1FF"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const [activeSubscription] = useState<ApexOptions>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#60DD97"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4,
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#60DD97"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const [expiredSubscription] = useState<ApexOptions>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#DE5555"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4,
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#DE5555"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const exportToExcel = () => {
    const exportData = filteredData || data || [];
    if (exportData.length === 0) return;
    const csvData = exportData.map(item => ({
      "Customer Name": item.customerName || "Walk-in Customer",
      "Plan": item.plan || "Standard ERP",
      "Billing Cycle": "30 Days",
      "Payment Method": item.invoiceType || "Intrastate",
      "Amount": item.grandTotal || 0,
      "Created Date": item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString("en-IN") : "N/A",
      "Expired On": item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "N/A",
      "Status": item.paymentStatus || "Unpaid",
    }));
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(obj => Object.values(obj).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscriptions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const element = document.querySelector('.table-responsive') as HTMLElement;
    if (element) {
      html2pdf().from(element).save('subscriptions.pdf');
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
                <h4>Subscriptions</h4>
                <h6>Manage your subscriptions</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons onPdfClick={exportToPDF} onExcelClick={exportToExcel} />
              <RefreshIcon onClick={fetchSubscriptions} />
              <CollapesIcon />
            </ul>
          </div>

          <div className="row">
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Total Transaction
                          </span>
                          <h5>₹{Math.round(data.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)).toLocaleString()}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={totalTransaction}
                          series={[{
                            name: "Transactions",
                            data: Array.from({ length: 12 }, (_, i) => data.filter(inv => new Date(inv.invoiceDate).getMonth() === i).reduce((sum, inv) => sum + (inv.grandTotal || 0), 0))
                          }]}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Total Subscribers
                          </span>
                          <h5>{new Set(data.map(inv => inv.customerName).filter(Boolean)).size || data.length}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={totalSubscription}
                          series={[{
                            name: "Subscribers",
                            data: Array.from({ length: 12 }, (_, i) => data.filter(inv => new Date(inv.invoiceDate).getMonth() === i).length)
                          }]}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Active Subscribers
                          </span>
                          <h5>{data.filter(inv => inv.paymentStatus === 'Paid').length}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={activeSubscription}
                          series={[{
                            name: "Active Subscribers",
                            data: Array.from({ length: 12 }, (_, i) => data.filter(inv => inv.paymentStatus === 'Paid' && new Date(inv.invoiceDate).getMonth() === i).length)
                          }]}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Expired Subscribers
                          </span>
                          <h5>{data.filter(inv => inv.paymentStatus !== 'Paid').length}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={expiredSubscription}
                          series={[{
                            name: "Expired Subscribers",
                            data: Array.from({ length: 12 }, (_, i) => data.filter(inv => inv.paymentStatus !== 'Paid' && new Date(inv.invoiceDate).getMonth() === i).length)
                          }]}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                    {filterPlan || "Select Plan"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlan("Advanced (Monthly)")}>
                        Advanced (Monthly)
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlan("Basic (Yearly)")}>
                        Basic (Yearly)
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlan("Enterprise (Monthly)")}>
                        Enterprise (Monthly)
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterPlan(null)}>
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
                    {filterStatus || "Select Status"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Paid")}>
                        Paid
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Unpaid")}>
                        Unpaid
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus(null)}>
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
              <div className="table-responsive">
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
      {/* View Invoice */}
      <div className="modal fade" id="view_invoice">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-body p-5">
              <div className="row justify-content-between align-items-center mb-3">
                <div className="col-md-6">
                  <div className="mb-4">
                    <div className="invoice-logo">
                    <Link
                      className="logo logo-normal"
                      to="#"
                    >
                      <img src={logo} width="130" className="img-fluid" alt="logo" />
                    </Link>
                    <Link
                      className="logo logo-white"
                      to="#"
                    >
                      <img src={logoWhite} width="130" className="img-fluid" alt="logo" />
                    </Link>
                  </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className=" text-end mb-3">
                    <h5 className="text-dark mb-1">Invoice</h5>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-file-invoice me-1" />
                      INV0287
                    </p>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-calendar me-1" />
                      Issue date : 12 Sep 2024{" "}
                    </p>
                    <p className="fw-normal">
                      <i className="ti ti-calendar me-1" />
                      Due date : 12 Oct 2024{" "}
                    </p>
                  </div>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-7">
                  <p className="text-dark mb-2 fw-medium fs-16">Invoice From :</p>
                  <div>
                    <p className="mb-1">SmartHR</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">smarthr@example.com</p>
                  </div>
                </div>
                <div className="col-md-5">
                  <p className="text-dark mb-2 fw-medium fs-16">Invoice To :</p>
                  <div>
                    <p className="mb-1">BrightWave Innovations</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">michael@example.com</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="table-responsive mb-3">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Plan</th>
                        <th>Billing Cycle</th>
                        <th>Created Date</th>
                        <th>Expiring On</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Advanced (Monthly)</td>
                        <td>30 Days</td>
                        <td>12 Sep 2024</td>
                        <td>12 Oct 2024</td>
                        <td>$200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-4">
                  <div>
                    <h6 className="mb-4">Payment info:</h6>
                    <p className="mb-0">Credit Card - 123***********789</p>
                    <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                      <p className="mb-0">Amount</p>
                      <p className="text-dark fw-medium mb-2">$200.00</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Sub Total</p>
                    <p className="mb-2">$200.00</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Tax </p>
                    <p className="mb-2">$0.00</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Total</p>
                    <p className="text-dark fw-medium mb-2">$200.00</p>
                  </div>
                </div>
              </div>
              <div className="card border mb-0">
                <div className="card-body">
                  <p className="text-dark fw-medium mb-2">
                    Terms &amp; Conditions:
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline mb-2">
                    <i className="ti ti-point-filled text-primary me-1" />
                    All payments must be made according to the agreed schedule. Late
                    payments may incur additional fees.
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline">
                    <i className="ti ti-point-filled text-primary me-1" />
                    We are not liable for any indirect, incidental, or consequential
                    damages, including loss of profits, revenue, or data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Invoice */}
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
                  <Link to="#" className="btn btn-primary" data-bs-dismiss="modal">
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

export default Subscription