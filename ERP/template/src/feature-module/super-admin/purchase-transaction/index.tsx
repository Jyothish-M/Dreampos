import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import html2pdf from "html2pdf.js";;
import PrimeDataTable from "../../../components/data-table";
import SearchFromApi from "../../../components/data-table/search";
import CommonFooter from '../../../components/footer/commonFooter';
import TooltipIcons from '../../../components/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../components/tooltip-content/refresh';
import CollapesIcon from '../../../components/tooltip-content/collapes';
import { logo, logoWhite } from '../../../utils/imagepath';
import { InvoiceService } from '../../services/invoice.service';

const PurchaseTransaction = () => {
  const [data, setData] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, _setSelectedProducts] = useState<any[]>([]);
  const [filterMethod, setFilterMethod] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSort, setFilterSort] = useState<string>("Recently Added");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await InvoiceService.getAllInvoices();
      if (res.status && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Error loading purchase transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };
  
  const filteredData = data.filter((item) => {
    let match = true;
    if (filterMethod) {
      match = match && ((item.paymentMethod || "UPI") === filterMethod);
    }
    if (filterStatus) {
      match = match && ((item.paymentStatus || "Unpaid") === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      match = match && (
        (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(q)) ||
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
      header: "Invoice ID",
      field: "invoiceNumber",
      sortable: true,
      key: "invoiceNumber",
      body: (rowData: any) => (
        <Link to="#" className="link-default">{rowData.invoiceNumber || "#N/A"}</Link>
      ),
    },
    {
      header: "Customer",
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
      header: "Email",
      field: "customerEmail",
      sortable: true,
      key: "customerEmail",
      body: (rowData: any) => (
        <span>{rowData.customerEmail || "No Email"}</span>
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
      header: "Amount",
      field: "grandTotal",
      sortable: true,
      key: "grandTotal",
      body: (rowData: any) => (
        <span>₹{Math.round(rowData.grandTotal || 0).toLocaleString()}</span>
      ),
    },
    {
      header: "Payment Method",
      field: "paymentMethod",
      sortable: true,
      key: "paymentMethod",
      body: (rowData: any) => (
        <span>{rowData.paymentMethod || "UPI"}</span>
      ),
    },
    {
      header: "Status",
      field: "paymentStatus",
      sortable: true,
      key: "paymentStatus",
      body: (rowData: any) => (
        <Link
          to="#"
          className={`badge ${rowData.paymentStatus === 'Paid' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}
        >
          <i className="ti ti-point-filled me-1"></i>
          {rowData.paymentStatus || "Unpaid"}
        </Link>
      ),
    },
    {
      header: "",
      field: "action",
      sortable: false,
      key: "action",
      body: () => (
        <div className="action-icon d-inline-flex align-items-center">
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded me-2"
            data-bs-toggle="modal"
            data-bs-target="#view_invoice"
          >
            <i className="ti ti-file-invoice" />
          </Link>
          <Link to="#" className="p-2 d-flex align-items-center border rounded me-2">
            <i className="ti ti-download" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            className="p-2 d-flex align-items-center border rounded"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>

      ),
    },
  ]
  const exportToExcel = () => {
    const exportData = filteredData || data || [];
    if (exportData.length === 0) return;
    const csvData = exportData.map(item => ({
      "Invoice ID": item.invoiceNumber || "#N/A",
      "Customer": item.customerName || "Walk-in Customer",
      "Email": item.customerEmail || "No Email",
      "Created Date": item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString("en-IN") : "N/A",
      "Amount": item.grandTotal || 0,
      "Payment Method": item.paymentMethod || "UPI",
      "Status": item.paymentStatus || "Unpaid",
    }));
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(obj => Object.values(obj).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const element = document.querySelector('.table-responsive') as HTMLElement;
    if (element) {
      html2pdf().from(element).save('transactions.pdf');
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
                <h4>Purchase Transaction</h4>
                <h6>Manage your purchase transaction</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons onPdfClick={exportToPDF} onExcelClick={exportToExcel} />
              <RefreshIcon onClick={fetchTransactions} />
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
                    {filterMethod || "Payment Method"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterMethod("Credit Card")}>
                          Credit Card
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterMethod("Paypal")}>
                          Paypal
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterMethod("Debit Card")}>
                          Debit Card
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterMethod(null)}>
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
                  selection={selectedProducts}
/>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
      {/* /Page Wrapper */}
      {/* Invoices */}
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
                  <p className="text-dark mb-2 fw-medium fs-16 text-end">
                    Invoice To :
                  </p>
                  <div>
                    <p className="mb-1 text-end">BrightWave Innovations</p>
                    <p className="mb-1 text-end">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1 text-end">michael@example.com</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="table-responsive mb-3">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Plan</th>
                        <th className="text-end">Billing Cycle</th>
                        <th className="text-end">Created Date</th>
                        <th className="text-end">Expiring On</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Advanced (Monthly)</td>
                        <td className="text-end">30 Days</td>
                        <td className="text-end">12 Sep 2024</td>
                        <td className="text-end">12 Oct 2024</td>
                        <td className="text-end">$200</td>
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
      {/* /Invoices */}
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

export default PurchaseTransaction