import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import CollapesIcon from "../../../components/tooltip-content/collapes";
import CommonFooter from "../../../components/footer/commonFooter";
import type { ApexOptions } from "apexcharts";
import { all_routes } from "../../../routes/all_routes";
import CommonDateRangePicker from "../../../components/date-range-picker/common-date-range-picker";
import { dashboardService } from "../../services/dashboard.service";
import { StoreService } from "../../services/store.service";
import { InvoiceService } from "../../services/invoice.service";

const SuperAdminDashboard = () => {
  const routes = all_routes;

  // ── Backend State & Loading ──────────────────────────────────────────────────
  const [_summaryData, setSummaryData] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [_recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{start: string, end: string} | null>(null);
  const [companiesFilter, setCompaniesFilter] = useState("This Week");
  const [revenueFilter, setRevenueFilter] = useState("2025");
  const [plansFilter, setPlansFilter] = useState("This Month");

  const fetchData = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const [summaryRes, storeRes, invoiceRes] = await Promise.all([
        dashboardService.getSummary(start, end),
        StoreService.getStores({ limit: 100 }),
        InvoiceService.getAllInvoices()
      ]);
      if (summaryRes.status && summaryRes.data) {
        setSummaryData(summaryRes.data.summary);
        setRecentTransactions(summaryRes.data.transactions?.recentSales || []);
        setExpiredProducts(summaryRes.data.expiredProducts || []);
      }
      if (storeRes.status && storeRes.data) {
        setStores(storeRes.data);
      }
      if (invoiceRes.status && invoiceRes.data) {
        setInvoices(invoiceRes.data);
      }
    } catch (error) {
      console.error("Super Admin Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateRange?.start, dateRange?.end);
  }, [dateRange]);

  const handleRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const [CompanyChart] = useState<ApexOptions>({
    chart: {
      height: 240,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    colors: ["#212529"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        borderRadius: 10,
        borderRadiusWhenStacked: "all",
        horizontal: false,
        colors: {
          backgroundBarColors: ["#f3f4f5"], // Background color for bars
          backgroundBarOpacity: 0.5,
        },
      },
    },
    series: [
      {
        name: "Company",
        data: [40, 60, 20, 80, 60, 60, 60],
      },
    ],
    xaxis: {
      categories: ["M", "T", "W", "T", "F", "S", "S"],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      labels: {
        offsetX: -15,
        show: false,
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        left: -8,
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    fill: {
      opacity: 1,
    },
  });
  const [RevenueChart] = useState<ApexOptions>({
    chart: {
      height: 230,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    colors: ["#FF6F28", "#F8F9FA"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        borderRadius: 5,
        borderRadiusWhenStacked: "all",
        horizontal: false,
      },
    },
    series: [
      {
        name: "Income",
        data: [40, 30, 45, 80, 85, 90, 80, 80, 80, 85, 20, 80],
      },
      {
        name: "Expenses",
        data: [60, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20],
      },
    ],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      min: 0, // Set the minimum value of the Y-axis to 0
      max: 100,
      labels: {
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
        formatter: function (value: any) {
          return value + "K"; // Divide by 1000 and append 'K'
        },
      },
    },
    grid: {
      borderColor: "transparent",
      strokeDashArray: 5,
      padding: {
        left: -8,
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: function (val: any) {
          return val / 10 + " k";
        },
      },
    },
    fill: {
      opacity: 1,
    },
  });
  const [PlanChart] = useState<ApexOptions>({
    chart: {
      height: 240,
      type: "donut",
      toolbar: {
        show: false,
      },
    },
    colors: ["#1B84FF", "#FFC107", "#F26522"],
    series: [20, 60, 20],
    labels: ["Enterprise", "Advanced", "Basic"],
    plotOptions: {
      pie: {
        donut: {
          size: "50%",
          labels: {
            show: false,
          },
        },
      },
    },
    stroke: {
      lineCap: "round",
      show: true,
      width: 0, // Space between donut sections
      colors: ["#fff"],
    },
    dataLabels: {
      enabled: false,
    },
    legend: { show: false },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 180,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  });
  const [ApexChart] = useState<ApexOptions>({
    series: [
      {
        name: "Messages",
        data: [5, 10, 7, 5, 10, 7, 5],
      },
    ],

    chart: {
      type: "bar",
      width: 70,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      dropShadow: {
        enabled: false,
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff",
      },
      sparkline: {
        enabled: !0,
      },
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth",
    },
    colors: ["#FF6F28"],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
      ],
      labels: {
        show: false,
      },
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },

      marker: {
        show: false,
      },
    },
  });
  const [ApexChart2] = useState<ApexOptions>({
    series: [
      {
        name: "Messages",
        data: [5, 3, 7, 6, 3, 10, 5],
      },
    ],

    chart: {
      type: "bar",
      width: 70,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      dropShadow: {
        enabled: false,
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff",
      },
      sparkline: {
        enabled: !0,
      },
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth",
    },
    colors: ["#4B3088"],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
      ],
      labels: {
        show: false,
      },
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },

      marker: {
        show: false,
      },
    },
  });
  const [ApexChart3] = useState<ApexOptions>({
    series: [
      {
        name: "Messages",
        data: [8, 10, 10, 8, 8, 10, 8],
      },
    ],

    chart: {
      type: "bar",
      width: 70,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      dropShadow: {
        enabled: false,
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff",
      },
      sparkline: {
        enabled: !0,
      },
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth",
    },
    colors: ["#177DBC"],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
      ],
      labels: {
        show: false,
      },
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },

      marker: {
        show: false,
      },
    },
  });
  const [ApexChart4] = useState<ApexOptions>({
    series: [
      {
        name: "Messages",
        data: [5, 10, 7, 5, 10, 7, 5],
      },
    ],

    chart: {
      type: "bar",
      width: 70,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      dropShadow: {
        enabled: false,
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff",
      },
      sparkline: {
        enabled: !0,
      },
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth",
    },
    colors: ["#2DCB73"],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
      ],
      labels: {
        show: false,
      },
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },

      marker: {
        show: false,
      },
    },
  });
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-lg-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="mb-1">Welcome, Admin</h2>
            <p>
              You have <span className="text-primary fw-bold">200+</span> Orders, Today
            </p>
          </div>
          <ul className="table-top-head">
            <li>
              <div className="input-icon-start position-relative">
                <span className="input-icon-addon fs-16 text-gray-9">
                  <i className="ti ti-calendar" />
                </span>
                <CommonDateRangePicker onRangeChange={handleRangeChange} />
              </div>
            </li>
            <CollapesIcon />
          </ul>
        </div>
        {/* Welcome Wrap */}
        <div className="welcome-wrap mb-4">
          <div className=" d-flex align-items-center justify-content-between flex-wrap">
            <div className="mb-3">
              <h2 className="mb-1 text-white">Welcome Back, Super Admin</h2>
              <p className="text-light">
                {stores.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length} New Companies Subscribed Today !!!
              </p>
            </div>
            <div className="d-flex align-items-center flex-wrap mb-1">
              <Link
                to={routes.companies}
                className="btn btn-dark btn-md me-2 mb-2"
              >
                Companies
              </Link>
              <Link
                to={routes.packagelist}
                className="btn btn-light btn-md mb-2"
              >
                All Packages
              </Link>
            </div>
          </div>
          <div className="welcome-bg">
            <img
              src="src/assets/img/bg/welcome-bg-02.svg"
              alt="img"
              className="welcome-bg-01"
            />
            <img
              src="src/assets/img/bg/welcome-bg-03.svg"
              alt="img"
              className="welcome-bg-02"
            />
            <img
              src="src/assets/img/bg/welcome-bg-01.svg"
              alt="img"
              className="welcome-bg-03"
            />
          </div>
        </div>
        {/* /Welcome Wrap */}

        <div className="row">
          {/* Total Companies */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="avatar avatar-md bg-dark mb-3">
                    <i className="ti ti-building fs-16" />
                  </span>
                  <span className="badge bg-success fw-normal mb-3">Active</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h2 className="mb-1">{stores.length}</h2>
                    <p className="fs-13">Total Companies</p>
                  </div>
                  <ReactApexChart
                    options={ApexChart}
                    series={[{ name: "Companies", data: [stores.length || 0, stores.length || 0, stores.length || 0] }]}
                    type="bar"
                    width={70}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* /Total Companies */}

          {/* Active Companies */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="avatar avatar-md bg-dark mb-3">
                    <i className="ti ti-carousel-vertical fs-16" />
                  </span>
                  <span className="badge bg-success fw-normal mb-3">Active</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h2 className="mb-1">{stores.filter(s => s.status === "Active").length}</h2>
                    <p className="fs-13">Active Companies</p>
                  </div>
                  <ReactApexChart
                    options={ApexChart2}
                    series={[{ name: "Active Companies", data: [stores.filter(s => s.status === "Active").length || 0, stores.filter(s => s.status === "Active").length || 0] }]}
                    type="bar"
                    width={70}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* /Active Companies */}

          {/* Total Subscribers */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="avatar avatar-md bg-dark mb-3">
                    <i className="ti ti-chalkboard-off fs-16" />
                  </span>
                  <span className="badge bg-success fw-normal mb-3">Active</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h2 className="mb-1">{stores.filter(s => s.plan && s.plan !== "Basic").length}</h2>
                    <p className="fs-13">Total Subscribers</p>
                  </div>
                  <ReactApexChart
                    options={ApexChart3}
                    series={[{ name: "Subscribers", data: [stores.filter(s => s.plan && s.plan !== "Basic").length, stores.filter(s => s.plan && s.plan !== "Basic").length] }]}
                    type="bar"
                    width={70}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* /Total Subscribers */}

          {/* Total Earnings */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="avatar avatar-md bg-dark mb-3">
                    <i className="ti ti-businessplan fs-16" />
                  </span>
                  <span className={`badge bg-success fw-normal mb-3`}>
                    +10%
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h2 className="mb-1">₹{Math.round(invoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)).toLocaleString()}</h2>
                    <p className="fs-13">Total Earnings</p>
                  </div>
                  <ReactApexChart
                    options={ApexChart4}
                    series={[{ name: "Earnings", data: [Math.round(invoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0))] }]}
                    type="bar"
                    width={70}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* /Total Earnings */}
        </div>
        <div className="row">
          {/* Companies */}
          <div className="col-xxl-3 col-lg-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-2">Companies</h5>
                <div className="dropdown mb-2">
                  <Link
                    to="#"
                    className="btn btn-white border btn-sm d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-calendar me-1" />
                    {companiesFilter}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setCompaniesFilter("This Month")}>
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setCompaniesFilter("This Week")}>
                        This Week
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setCompaniesFilter("Today")}>
                        Today
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body">
                <ReactApexChart
                  id="company-chart"
                  options={CompanyChart}
                  series={[{
                    name: "Company",
                    data: [1, 2, 3, 4, 5, 6, 0].map(dayIndex => 
                      stores.filter(s => {
                        const d = new Date(s.createdAt);
                        const now = new Date();
                        if (companiesFilter === "Today") return d.toDateString() === now.toDateString();
                        if (companiesFilter === "This Week") return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
                        if (companiesFilter === "This Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        return true;
                      }).filter(s => new Date(s.createdAt).getDay() === dayIndex).length
                    )
                  }]}
                  type="bar"
                  height={240}
                />
                <p className="f-13 d-inline-flex align-items-center">
                  <span className="badge badge-success me-1">+6%</span> 5
                  Companies from last month
                </p>
              </div>
            </div>
          </div>
          {/* /Companies */}
          {/* Revenue */}
          <div className="col-lg-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-2">Revenue</h5>
                <div className="dropdown mb-2">
                  <Link
                    to="#"
                    className="btn btn-white border btn-sm d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-calendar me-1" />
                    {revenueFilter}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setRevenueFilter("2024")}>
                        2024
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setRevenueFilter("2025")}>
                        2025
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setRevenueFilter("2023")}>
                        2023
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <div className="mb-1">
                    <h5 className="mb-1">₹{Math.round(invoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)).toLocaleString()}</h5>
                    <p>
                      <span className="text-success fw-bold">+40%</span>{" "}
                      increased from last year
                    </p>
                  </div>
                  <p className="fs-13 text-gray-9 d-flex align-items-center mb-1">
                    <i className="ti ti-circle-filled me-1 fs-6 text-primary" />
                    Revenue
                  </p>
                </div>
                <ReactApexChart
                  id="revenue-income"
                  options={RevenueChart}
                  series={[
                    {
                      name: "Income",
                      data: Array.from({ length: 12 }, (_, i) => 
                        invoices
                          .filter(inv => inv.paymentStatus === 'Paid' && new Date(inv.invoiceDate).getFullYear().toString() === revenueFilter && new Date(inv.invoiceDate).getMonth() === i)
                          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
                      )
                    },
                    {
                      name: "Expenses",
                      data: Array.from({ length: 12 }, (_, i) => 
                        invoices
                          .filter(inv => inv.paymentStatus !== 'Paid' && new Date(inv.invoiceDate).getFullYear().toString() === revenueFilter && new Date(inv.invoiceDate).getMonth() === i)
                          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0) 
                      )
                    }
                  ]}
                  type="bar"
                  height={230}
                />
              </div>
            </div>
          </div>
          {/* /Revenue */}
          {/* Top Plans */}
          <div className="col-xxl-3 col-xl-12 d-flex">
            <div className="card flex-fill">
              <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-2">Top Plans</h5>
                <div className="dropdown mb-2">
                  <Link
                    to="#"
                    className="btn btn-white border btn-sm d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-calendar me-1" />
                    {plansFilter}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setPlansFilter("This Month")}>
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setPlansFilter("This Week")}>
                        This Week
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setPlansFilter("Today")}>
                        Today
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={PlanChart}
                  series={[
                    stores.filter(s => {
                      const d = new Date(s.createdAt);
                      const now = new Date();
                      if (plansFilter === "Today") return d.toDateString() === now.toDateString();
                      if (plansFilter === "This Week") return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
                      if (plansFilter === "This Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      return true;
                    }).filter(s => s.plan?.toLowerCase().includes("enterprise") && !s.plan?.toLowerCase().includes("advanced")).length,
                    stores.filter(s => {
                      const d = new Date(s.createdAt);
                      const now = new Date();
                      if (plansFilter === "Today") return d.toDateString() === now.toDateString();
                      if (plansFilter === "This Week") return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
                      if (plansFilter === "This Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      return true;
                    }).filter(s => s.plan?.toLowerCase().includes("advanced") || s.plan?.toLowerCase().includes("standard")).length,
                    stores.filter(s => {
                      const d = new Date(s.createdAt);
                      const now = new Date();
                      if (plansFilter === "Today") return d.toDateString() === now.toDateString();
                      if (plansFilter === "This Week") return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
                      if (plansFilter === "This Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      return true;
                    }).filter(s => s.plan?.toLowerCase().includes("basic") || (!s.plan)).length
                  ]}
                  type="donut"
                  height={240}
                />
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <p className="f-13 mb-0">
                    <i className="ti ti-circle-filled text-primary me-1" />
                    Basic{" "}
                  </p>
                  <p className="f-13 fw-medium text-gray-9">
                    {Math.round((stores.filter(s => s.plan?.toLowerCase().includes("basic") || (!s.plan)).length / (stores.length || 1)) * 100)}%
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <p className="f-13 mb-0">
                    <i className="ti ti-circle-filled text-warning me-1" />
                    Advanced
                  </p>
                  <p className="f-13 fw-medium text-gray-9">
                    {Math.round((stores.filter(s => s.plan?.toLowerCase().includes("advanced") || s.plan?.toLowerCase().includes("standard")).length / (stores.length || 1)) * 100)}%
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-0">
                  <p className="f-13 mb-0">
                    <i className="ti ti-circle-filled text-info me-1" />
                    Enterprise
                  </p>
                  <p className="f-13 fw-medium text-gray-9">
                    {Math.round((stores.filter(s => s.plan?.toLowerCase().includes("enterprise") && !s.plan?.toLowerCase().includes("advanced")).length / (stores.length || 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* /Top Plans */}
        </div>
        <div className="row">
          {/* Recent Transactions */}
          <div className="col-xxl-4 col-xl-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-2">Recent Transactions</h5>
                <Link
                  to={routes.purchasetransaction}
                  className="btn btn-light btn-md mb-2"
                >
                  View All
                </Link>
              </div>
              <div className="card-body pb-2">
                {stores.filter(s => s.plan && s.plan !== "Basic").length === 0 ? (
                  <div className="text-center py-4 text-muted fs-13">No recent transactions</div>
                ) : (
                  stores.filter(s => s.plan && s.plan !== "Basic").slice(0, 5).map((store: any, idx: number) => (
                    <div key={store._id || idx} className="d-sm-flex justify-content-between flex-wrap mb-3 border-bottom pb-2">
                      <div className="d-flex align-items-center mb-2">
                        <span className="avatar bg-gray-100 rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                          <i className="ti ti-receipt text-primary fs-18" />
                        </span>
                        <div className="ms-2 flex-fill">
                          <h6 className="fs-medium text-truncate mb-1">
                            <Link to="#">{store.name}</Link>
                          </h6>
                          <p className="fs-13 d-inline-flex align-items-center">
                            <span className="text-info">{store.package?.name || "Advanced Plan"}</span>
                            <i className="ti ti-circle-filled fs-6 text-primary mx-1" />
                            {new Date(store.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm-end mb-2">
                        <h6 className="mb-1">₹{Math.round(store.plan === 'Enterprise' ? 400 : (store.plan === 'Advanced' ? 200 : 0)).toLocaleString()}</h6>
                        <p className="fs-13 text-success">Success</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* /Recent Transactions */}
          {/* Recently Registered */}
          <div className="col-xxl-4 col-xl-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-2">Recently Registered</h5>
                <Link
                  to={routes.companies}
                  className="btn btn-light btn-md mb-2"
                >
                  View All
                </Link>
              </div>
              <div className="card-body pb-2">
                {stores.length === 0 ? (
                  <div className="text-center py-4 text-muted fs-13">No companies registered yet</div>
                ) : (
                  stores.slice(0, 5).map((store: any, idx: number) => (
                    <div key={store._id || idx} className="d-sm-flex justify-content-between flex-wrap mb-3 border-bottom pb-2">
                      <div className="d-flex align-items-center mb-2">
                        <span className="avatar bg-gray-100 rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                          <i className="ti ti-building text-warning fs-18" />
                        </span>
                        <div className="ms-2 flex-fill">
                          <h6 className="fs-medium text-truncate mb-1">
                            <Link to="#">{store.name}</Link>
                          </h6>
                          <p className="fs-13 text-muted">{store.email || "No email"}</p>
                        </div>
                      </div>
                      <div className="text-sm-end mb-2">
                        <span className={`badge ${store.status === "Active" ? "bg-success" : "bg-danger"}`}>
                          {store.status || "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* /Recently Registered */}
          {/* Expired Items Log */}
          <div className="col-xxl-4 col-xl-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-2">Expired Items Log</h5>
              </div>
              <div className="card-body pb-2">
                {expiredProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted fs-13">No expired items found</div>
                ) : (
                  expiredProducts.slice(0, 5).map((p: any, idx: number) => (
                    <div key={p._id || idx} className="d-sm-flex justify-content-between flex-wrap mb-3 border-bottom pb-2">
                      <div className="d-flex align-items-center mb-2">
                        <span className="avatar bg-gray-100 rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                          <i className="ti ti-alert-triangle text-danger fs-18" />
                        </span>
                        <div className="ms-2 flex-fill">
                          <h6 className="fs-medium text-truncate mb-1">
                            <Link to="#">{p.product || "Unnamed Product"}</Link>
                          </h6>
                          <p className="fs-13 text-muted">
                            Expired: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm-end mb-2">
                        <span className="text-danger fs-13 fw-bold">Qty: {p.quantity || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* /Expired Items Log */}
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default SuperAdminDashboard;
