import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import { dashboardService } from "../services/dashboard.service";
import {
  dash1,
  dash2,
  dash3,
  dash4,
  fileTextIcon1,
} from "../../utils/imagepath";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Dashboard = () => {
  const route = all_routes;

  // ── State ────────────────────────────────────────────────────────────────────
  const [summaryData, setSummaryData] = useState<any>(null);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<any[]>([]);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [chartSeries, setChartSeries] = useState<any[]>([
    { name: "Sales", data: new Array(12).fill(0) },
    { name: "Purchase", data: new Array(12).fill(0) },
  ]);
  const [chartMonths, setChartMonths] = useState<string[]>([
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // ── Fetch summary + products + expired ───────────────────────────────────────
  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSummary();
      if (res.status && res.data) {
        setSummaryData(res.data.summary);
        setRecentProducts(res.data.topSellingProducts || []);
        setExpiredProducts(res.data.expiredProducts || []);
      }
    } catch (error) {
      console.error("Dashboard summary error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch chart data for a given year ────────────────────────────────────────
  const fetchCharts = async (year: number) => {
    try {
      const res = await dashboardService.getCharts(year);
      if (res.status && res.data) {
        const { months, sales, purchases } = res.data;
        setChartMonths(months);
        setChartSeries([
          { name: "Sales", data: sales.map((v: number) => Math.round(v)) },
          { name: "Purchase", data: purchases.map((v: number) => -Math.round(v)) },
        ]);
      }
    } catch (error) {
      console.error("Dashboard chart error:", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchCharts(chartYear);
  }, [chartYear]);

  // ── Checkbox helpers ──────────────────────────────────────────────────────────
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setSelectedItems(checked ? new Set(expiredProducts.map((_: any, i: number) => i)) : new Set());
  };

  const handleRowCheckbox = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = new Set(selectedItems);
    e.target.checked ? newSelected.add(index) : newSelected.delete(index);
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === expiredProducts.length);
  };

  // ── Chart options (static config, series injected dynamically) ───────────────
  const chartOptions: any = {
    colors: ["#28C76F", "#EA5455"],
    chart: { type: "bar", height: 320, stacked: true, zoom: { enabled: true } },
    responsive: [{ breakpoint: 280, options: { legend: { position: "bottom", offsetY: 0 } } }],
    plotOptions: {
      bar: { horizontal: false, borderRadius: 4, borderRadiusApplication: "end", borderRadiusWhenStacked: "all", columnWidth: "20%" },
    },
    dataLabels: { enabled: false },
    yaxis: { tickAmount: 5 },
    xaxis: { categories: chartMonths },
    legend: { show: false },
    fill: { opacity: 1 },
  };

  // ── Image helper ──────────────────────────────────────────────────────────────
  const getProductImage = (images: any[]) => {
    if (images && images.length > 0) {
      const img = images[0];
      const src = typeof img === "string" ? img : img?.url || img?.path || "";
      if (src) return src.startsWith("http") ? src : `${BACKEND_URL}${src}`;
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-wrapper">
        <div className="content">

          {/* ── Summary KPI Cards ── */}
          <div className="row">
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card dash-widget w-100">
                <div className="card-body d-flex align-items-center">
                  <div className="dash-widgetimg"><span><img src={dash1} alt="img" /></span></div>
                  <div className="dash-widgetcontent">
                    <h5>
                      <CountUp className="counters" start={0} end={summaryData?.totalPurchases || 0} duration={3} prefix="₹" separator="," />
                    </h5>
                    <p className="mb-0">Total Purchase Amount</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card dash-widget dash1 w-100">
                <div className="card-body d-flex align-items-center">
                  <div className="dash-widgetimg"><span><img src={dash2} alt="img" /></span></div>
                  <div className="dash-widgetcontent">
                    <h5>
                      <CountUp className="counters" start={0} end={summaryData?.totalInvoicesDue || 0} duration={3} prefix="₹" separator="," />
                    </h5>
                    <p className="mb-0">Total Sales Due</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card dash-widget dash2 w-100">
                <div className="card-body d-flex align-items-center">
                  <div className="dash-widgetimg"><span><img src={dash3} alt="img" /></span></div>
                  <div className="dash-widgetcontent">
                    <h5>
                      <CountUp className="counters" start={0} end={summaryData?.totalSales || 0} duration={3} prefix="₹" separator="," />
                    </h5>
                    <p className="mb-0">Total Sale Amount</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card dash-widget dash3 w-100">
                <div className="card-body d-flex align-items-center">
                  <div className="dash-widgetimg"><span><img src={dash4} alt="img" /></span></div>
                  <div className="dash-widgetcontent">
                    <h5>
                      <CountUp className="counters" start={0} end={summaryData?.totalExpenses || 0} duration={3} prefix="₹" separator="," />
                    </h5>
                    <p className="mb-0">Total Expense Amount</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count">
                <div className="dash-counts">
                  <h4>{loading ? "—" : summaryData?.customerCount ?? 0}</h4>
                  <h5>Customers</h5>
                </div>
                <div className="dash-imgs"><i className="feather icon-user"></i></div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das1">
                <div className="dash-counts">
                  <h4>{loading ? "—" : summaryData?.supplierCount ?? 0}</h4>
                  <h5>Suppliers</h5>
                </div>
                <div className="dash-imgs"><i className="feather icon-user-check"></i></div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das2 bg-dark">
                <div className="dash-counts">
                  <h4>{loading ? "—" : summaryData?.invoiceCount ?? 0}</h4>
                  <h5>Purchase Invoice</h5>
                </div>
                <div className="dash-imgs"><img src={fileTextIcon1} className="img-fluid" alt="icon" /></div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das3">
                <div className="dash-counts">
                  <h4>{loading ? "—" : summaryData?.saleCount ?? 0}</h4>
                  <h5>Sales Invoice</h5>
                </div>
                <div className="dash-imgs"><i className="feather icon-file"></i></div>
              </div>
            </div>
          </div>

          {/* ── Purchase & Sales Chart + Recent Products ── */}
          <div className="row">
            {/* Bar Chart */}
            <div className="col-xl-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Purchase &amp; Sales</h5>
                  <div className="graph-sets">
                    <ul className="mb-0">
                      <li><span>Sales</span></li>
                      <li><span>Purchase</span></li>
                    </ul>
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-light btn-sm dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        {chartYear}
                      </button>
                      <ul className="dropdown-menu" aria-label="year-picker">
                        {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                          <li key={y}>
                            <Link to="#" className="dropdown-item" onClick={() => setChartYear(y)}>{y}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <Chart options={chartOptions} series={chartSeries} type="bar" height={320} />
                </div>
              </div>
            </div>

            {/* Recent / Top-Selling Products */}
            <div className="col-xl-5 col-sm-12 col-12 d-flex">
              <div className="card flex-fill default-cover mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Top Selling Products</h4>
                  <div className="view-all-link">
                    <Link to={route.productlist} className="view-all d-flex align-items-center">
                      View All <span className="ps-2 d-flex align-items-center"><i className="feather icon-arrow-right feather icon-16" /></span>
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive dataview">
                    <table className="table dashboard-recent-products">
                      <thead className="thead-light">
                        <tr>
                          <th>#</th>
                          <th>Products</th>
                          <th>Qty Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={3} className="text-center py-4">Loading...</td></tr>
                        ) : recentProducts.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-4 text-muted">No sales data yet</td></tr>
                        ) : (
                          recentProducts.map((p: any, idx: number) => {
                            const imgSrc = getProductImage(p.images);
                            return (
                              <tr key={p._id || idx}>
                                <td>{idx + 1}</td>
                                <td className="d-flex align-items-center">
                                  {imgSrc ? (
                                    <Link to={route.productlist} className="avatar avatar-lg me-2">
                                      <img src={imgSrc} alt={p.productName} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                                    </Link>
                                  ) : (
                                    <span className="avatar avatar-lg me-2 bg-light d-flex align-items-center justify-content-center rounded" style={{ width: 40, height: 40 }}>
                                      <i className="feather icon-box text-muted" />
                                    </span>
                                  )}
                                  <Link to={route.productlist} className="fw-bold">
                                    {p.productName || "Unnamed Product"}
                                  </Link>
                                </td>
                                <td>{p.totalQty ?? 0}</td>
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
          </div>

          {/* ── Expired Products Table ── */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Expired Products</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive dataview">
                <table className="table dashboard-expired-products">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" checked={selectAll} onChange={handleSelectAll} />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Manufactured Date</th>
                      <th>Expired Date</th>
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                    ) : expiredProducts.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">No expired products</td></tr>
                    ) : (
                      expiredProducts.map((p: any, idx: number) => {
                        const imgSrc = getProductImage(p.images);
                        return (
                          <tr key={p._id || idx}>
                            <td>
                              <label className="checkboxs">
                                <input type="checkbox" checked={selectedItems.has(idx)} onChange={handleRowCheckbox(idx)} />
                                <span className="checkmarks" />
                              </label>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                {imgSrc ? (
                                  <Link to="#" className="avatar avatar-lg me-2">
                                    <img src={imgSrc} alt={p.product} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                                  </Link>
                                ) : (
                                  <span className="avatar avatar-lg me-2 bg-light d-flex align-items-center justify-content-center rounded" style={{ width: 40, height: 40 }}>
                                    <i className="feather icon-box text-muted" />
                                  </span>
                                )}
                                <Link to="#" className="fw-bold">{p.product || "Unnamed"}</Link>
                              </div>
                            </td>
                            <td>{p.sku || p.itemCode || "N/A"}</td>
                            <td>{formatDate(p.manufacturedDate)}</td>
                            <td>{formatDate(p.expiryDate)}</td>
                            <td className="action-table-data">
                              <div className="edit-delete-action">
                                <Link className="me-2 p-2" to={route.productlist}><i className="feather icon-edit" /></Link>
                                <Link className="confirm-text p-2" to="#"><i className="feather icon-trash-2" /></Link>
                              </div>
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
      </div>
    </div>
  );
};

export default Dashboard;
