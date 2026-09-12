import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { all_routes } from "../../routes/all_routes";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { dashboardService } from "../services/dashboard.service";
import {
  HiIcon,
  purchasedEarningsIcon,
  totalSalesIcon,
  weeklyEarning,
} from "../../utils/imagepath";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SalesDashbaord = () => {
  const route = all_routes;

  // ── State ────────────────────────────────────────────────────────────────────
  const [summaryData, setSummaryData] = useState<any>(null);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [salesSeries, setSalesSeries] = useState<any[]>([
    {
      name: "Sales Analysis",
      data: new Array(12).fill(0),
    },
  ]);
  const [chartCategories, setChartCategories] = useState<string[]>([
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]);
  const [loading, setLoading] = useState(true);

  // ── Fetch data functions ──────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summaryRes = await dashboardService.getSummary();
      if (summaryRes.status && summaryRes.data) {
        setSummaryData(summaryRes.data.summary);
        setBestSellers(summaryRes.data.topSellingProducts || []);
        // Map recent sales to transactions table
        setRecentTransactions(summaryRes.data.transactions?.recentSales || []);
      }
    } catch (error) {
      console.error("Error loading sales dashboard summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (year: number) => {
    try {
      const chartRes = await dashboardService.getCharts(year);
      if (chartRes.status && chartRes.data) {
        const { months, sales } = chartRes.data;
        setChartCategories(months);
        setSalesSeries([
          {
            name: "Sales Analysis",
            data: sales.map((val: number) => Math.round(val)),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading sales dashboard charts:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchChartData(chartYear);
  }, [chartYear]);

  // ── Chart configuration ────────────────────────────────────────────────────────
  const chartOptions: any = {
    chart: {
      height: 273,
      type: "area",
      zoom: { enabled: false },
    },
    colors: ["#FF9F43"],
    dataLabels: { enabled: false },
    stroke: { curve: "straight" },
    xaxis: { categories: chartCategories },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
          return `₹${val}`;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
  };

  // ── Helper functions ─────────────────────────────────────────────────────────
  const getProductImage = (images: any[]) => {
    if (images && images.length > 0) {
      const img = images[0];
      const src = typeof img === "string" ? img : img?.url || img?.path || "";
      if (src) return src.startsWith("http") ? src : `${BACKEND_URL}${src}`;
    }
    return null;
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "success" || s === "completed") return "badge-success";
    if (s === "pending" || s === "sent") return "badge-warning";
    return "badge-danger";
  };

  const getFormattedTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="welcome d-lg-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center welcome-text">
              <h3 className="d-flex align-items-center">
                <img src={HiIcon} alt="img" />
                &nbsp;Hi Admin,
              </h3>
              &nbsp;
              <h6>here&apos;s what&apos;s happening with your store today.</h6>
            </div>
            <div className="d-flex align-items-center">
              <div className="input-icon-start position-relative me-2">
                <span className="input-icon-addon fs-16 text-gray-9">
                  <i className="ti ti-calendar" />
                </span>
                <CommonDateRangePicker />
              </div>
              <ul className="table-top-head">
                <RefreshIcon />
                <CollapesIcon />
              </ul>
            </div>
          </div>

          {/* ── KPI Widgets ── */}
          <div className="row sales-cards">
            {/* Weekly/Monthly Sales Earning */}
            <div className="col-xl-6 col-sm-12 col-12 d-flex">
              <div className="card d-flex align-items-center justify-content-between flex-fill mb-4">
                <div>
                  <h6>Sales Earnings</h6>
                  <h3>
                    ₹
                    <span className="counters">
                      {Math.round(summaryData?.totalSales || 0).toLocaleString()}
                    </span>
                  </h3>
                  <p className="sales-range">
                    <span className={summaryData?.salesChange >= 0 ? "text-success" : "text-danger"}>
                      <i className={`feather ${summaryData?.salesChange >= 0 ? "icon-chevron-up" : "icon-chevron-down"} feather-16`} />
                      {summaryData?.salesChange >= 0 ? "+" : ""}{summaryData?.salesChange}%&nbsp;
                    </span>
                    since last month
                  </p>
                </div>
                <img src={weeklyEarning} alt="img" />
              </div>
            </div>

            {/* Total Sales count */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card color-info bg-primary flex-fill mb-4">
                <div className="mb-2">
                  <img src={totalSalesIcon} alt="img" />
                </div>
                <h3>{loading ? "—" : summaryData?.saleCount ?? 0}</h3>
                <p>No of Total Sales</p>
              </div>
            </div>

            {/* Total Purchases count */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card color-info bg-secondary flex-fill mb-4">
                <div className="mb-2">
                  <img src={purchasedEarningsIcon} alt="img" />
                </div>
                <h3>{loading ? "—" : summaryData?.invoiceCount ?? 0}</h3>
                <p>No of Purchase Invoices</p>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Best Seller Section */}
            <div className="col-sm-12 col-md-12 col-xl-4 d-flex">
              <div className="card flex-fill w-100 mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Best Seller</h4>
                  <Link to={route.productlist} className="btn btn-outline-light btn-sm">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-borderless best-seller">
                      <tbody>
                        {loading ? (
                          <tr><td className="text-center py-4">Loading...</td></tr>
                        ) : bestSellers.length === 0 ? (
                          <tr><td className="text-center py-4 text-muted">No best sellers yet</td></tr>
                        ) : (
                          bestSellers.map((item, index) => {
                            const imgSrc = getProductImage(item.images);
                            return (
                              <tr key={item._id || index}>
                                <td className="pt-0 ps-0">
                                  <div className="d-flex align-items-center">
                                    {imgSrc ? (
                                      <Link to={route.productlist} className="avatar avatar-lg me-2">
                                        <img src={imgSrc} alt="img" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                                      </Link>
                                    ) : (
                                      <span className="avatar avatar-lg me-2 bg-light d-flex align-items-center justify-content-center rounded" style={{ width: 40, height: 40 }}>
                                        <i className="feather icon-box text-muted" />
                                      </span>
                                    )}
                                    <div>
                                      <h6 className="fw-medium">
                                        <Link to={route.productlist} className="fw-bold">
                                          {item.productName || "Unnamed"}
                                        </Link>
                                      </h6>
                                      <p>₹{Math.round(item.totalAmount || 0).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="pt-0">
                                  <p className="text-gray-9 mb-1">Sales</p>
                                  <p className="text-gray-9 fw-medium">{item.totalQty || 0}</p>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="col-sm-12 col-md-12 col-xl-8 d-flex">
              <div className="card flex-fill w-100 mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Recent Transactions</h4>
                  <Link to={route.saleslist} className="btn btn-outline-light btn-sm">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-borderless recent-transactions">
                      <thead className="thead-light">
                        <tr>
                          <th>#</th>
                          <th>Order Details</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                        ) : recentTransactions.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-4 text-muted">No recent sales transactions</td></tr>
                        ) : (
                          recentTransactions.map((tx, idx) => (
                            <tr key={tx._id || idx}>
                              <td>{idx + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div>
                                    <h6 className="fw-bold mb-1">
                                      {tx.customerId ? `${tx.customerId.firstName || ""} ${tx.customerId.lastName || ""}` : "Walk-in Customer"}
                                    </h6>
                                    <span className="d-flex align-items-center text-muted fs-12">
                                      <i className="feather icon-clock feather-14 me-1" />
                                      {getFormattedTime(tx.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="d-block head-text">{tx.paymentMethod || "Cash"}</span>
                                <span className="text-blue">{tx.invoiceNumber || tx.reference || "#N/A"}</span>
                              </td>
                              <td>
                                <span className={`badge badge-xs d-inline-flex align-items-center ${getStatusBadgeClass(tx.paymentStatus)}`}>
                                  <i className="ti ti-circle-filled fs-5 me-1" />
                                  {tx.paymentStatus || "Unpaid"}
                                </span>
                              </td>
                              <td className="fs-16 fw-bold text-gray-9">
                                ₹{Math.round(tx.grandTotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row sales-board">
            {/* Sales Analytics Chart */}
            <div className="col-md-12 col-lg-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Sales Analytics</h5>
                  <div className="graph-sets">
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-white btn-sm dropdown-toggle d-flex align-items-center"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="feather icon-calendar feather-14 me-1" />
                        {chartYear}
                      </button>
                      <ul className="dropdown-menu">
                        {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                          <li key={y}>
                            <Link to="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); setChartYear(y); }}>
                              {y}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body pt-1 pb-0">
                  <Chart
                    options={chartOptions}
                    series={salesSeries}
                    type="area"
                    height={273}
                  />
                </div>
              </div>
            </div>

            {/* Sales by Country */}
            <div className="col-md-12 col-lg-5 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Sales Statistics Overview</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3 py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-gray-9"><i className="feather icon-users me-2 text-primary" /> Total Customers</span>
                      <h5 className="mb-0">{loading ? "—" : summaryData?.customerCount ?? 0}</h5>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top pt-3">
                      <span className="text-gray-9"><i className="feather icon-package me-2 text-warning" /> Total Products</span>
                      <h5 className="mb-0">{loading ? "—" : summaryData?.productCount ?? 0}</h5>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top pt-3">
                      <span className="text-gray-9"><i className="feather icon-tag me-2 text-success" /> Active Categories</span>
                      <h5 className="mb-0">{loading ? "—" : summaryData?.categoryCount ?? 0}</h5>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top pt-3">
                      <span className="text-gray-9"><i className="feather icon-alert-triangle me-2 text-danger" /> Low Stock Warning</span>
                      <h5 className="mb-0 text-danger">{loading ? "—" : summaryData?.lowStockCount ?? 0}</h5>
                    </div>
                  </div>
                  <p className="sales-range border-top pt-3 mt-2">
                    <span className={summaryData?.salesChange >= 0 ? "text-success" : "text-danger"}>
                      <i className={`feather ${summaryData?.salesChange >= 0 ? "icon-chevron-up" : "icon-chevron-down"} feather-16`} />
                      {summaryData?.salesChange >= 0 ? "+" : ""}{summaryData?.salesChange}%&nbsp;
                    </span>
                    compare to last month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright-footer d-flex align-items-center justify-content-between border-top bg-white gap-3 flex-wrap">
          <p className="fs-13 text-gray-9 mb-0">
            2014-2025 © DreamsPOS. All Rights Reserved
          </p>
          <p>
            Designed &amp; Developed By Dreams{" "}
            <Link to="#" className="link-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SalesDashbaord;
