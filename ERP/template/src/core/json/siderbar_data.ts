import { all_routes } from "../../routes/all_routes";

const route = all_routes;

export const SidebarData = [

  {
    label: "Main",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: 'layout-grid',
        submenu: true,
        showSubRoute: false,

        submenuItems: [
          { label: "Admin Dashboard", link: "/index" },
          { label: "Admin Dashboard 2", link: "/admin-dashboard" },
          { label: "Sales Dashboard", link: "/sales-dashboard" },
          { label: "Analytics Dashboard", link: "/analytics-dashboard" },
        ],
      },
      {
        label: "Super Admin",
        icon: 'user-star',
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Dashboard", link: "/dashboard" },
          { label: "Companies", link: "/companies" },
          { label: "Subscriptions", link: "/subscription" },
          { label: "Packages", link: "/packages" },
          { label: "Domain", link: "/domain" },
          { label: "Purchase Transaction", link: "/purchase-transaction"},
        ],
      },
      // {
      //   label: "Application",
      //   icon: 'apps',
      //   submenu: true,
      //   showSubRoute: false,
      //   submenuItems: [
      //     { label: "Chat", link: "/chat" },
      //     {
      //       label: "Call",
      //       submenu: true,
      //       submenuItems: [
      //         { label: "Video Call", link: "/video-call" },
      //         { label: "Audio Call", link: "/audio-call" },
      //         { label: "Call History", link: "/call-history" },
      //       ],
      //     },
      //     { label: "Calendar", link: "/calendar" },
      //     { label: "Contacts", link: "/contacts" },
      //     { label: "Email", link: "/email" },
      //     { label: "To Do", link: "/todo" },
      //     { label: "Notes", link: "/notes" },
      //     { label: "File Manager", link: "/file-manager" },
      //     { label: "Projects", link: "/projects" },
      //     {
      //       label: "Ecommerce",
      //       submenu: true,
      //       submenuItems: [
      //         { label: "Products", link: "/products" },
      //         { label: "Orders", link: "/orders" },
      //       ],
      //     },
      //     { label: "Social Feed", link: "/social-feed" },
      //   ],
      // },
    ],
  },
  {
    label: "Inventory",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Inventory",
    submenuItems: [
      {
        label: "Products",
        link: "/product-list",
        icon: 'box',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Create Product",
        link: "/add-product",
        icon: 'table-plus',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Expired Products",
        link: "/expired-products",
        icon: 'progress-alert',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Low Stocks",
        link: "/low-stocks",
        icon: 'trending-up-2',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Category",
        link: "/category-list",
        icon: 'list-details',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Sub Category",
        link: "/sub-categories",
        icon: 'carousel-vertical',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Brands",
        link: "/brand-list",
        icon: 'triangles',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Units",
        link: "/units",
        icon: 'brand-unity',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Variant Attributes",
        link: "/variant-attributes",
        icon: 'file-symlink',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Warranties",
        link: "/warranty",
        icon: 'certificate',
        showSubRoute: false,
        submenu: false,
      },
      /*{
        label: "Print Barcode",
        link: "/barcode",
        icon: 'barcode',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Print QR Code",
        link: "/qrcode",
        icon: 'qrcode',
        showSubRoute: false,
        submenu: false,
      },*/
    ],
  },
  {
    label: "Stock",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Stock",
    submenuItems: [
      {
        label: "Manage Stock",
        link: "/manage-stocks",
        icon: 'package',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Stock Adjustment",
        link: "/stock-adjustment",
        icon: 'clipboard-list',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Stock Transfer",
        link: "/stock-transfer",
        icon: 'truck-delivery',
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
  {
    label: "Sales",
    submenuOpen: true,
    submenuHdr: "Sales",
    submenu: false,
    showSubRoute: false,
    submenuItems: [
      {
        label: "Sales",
        icon: 'layout-grid',
        submenuOpen: true,
        submenuHdr: "Sales",
        showSubRoute: false,
        submenu: false,
         link: route.sales,
      },
      {
        label: "Invoices",
        link: route.invoice,
        icon: 'file-invoice',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Quotation",
        link: "/quotation-list",
        icon: 'files',
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
  {
    label: "Purchases",
    submenuOpen: true,
    submenuHdr: "Purchases",
    showSubRoute: false,
    submenuItems: [
      {
        label: "Purchases",
        link: "/purchase-list",
        icon: 'shopping-bag',
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
     
      {
    label: "Finance & Accounts",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Finance & Accounts",
    submenuItems: [
      {
        label: "Expenses",
        icon: "file-text",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Expenses", link: "/expenses" },
          { label: "Expense Category", link: "/expense-category" },
        ],
      },
    ],
  },

  {
    label: "People",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "People",

    submenuItems: [
      {
        label: "Customers",
        link: route.customers,
        icon: 'users-group',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Suppliers",
        link: "/suppliers",
        icon: 'user-dollar',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Stores",
        link: "/store-list",
        icon: 'home-bolt',
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Warehouses",
        link: "/warehouse",
        icon: 'archive',
        showSubRoute: false,
        submenu: false,
      },
    ],
  },

  {
    label: "Financial Settings",
    submenu: true,
    showSubRoute: false,
    submenuHdr: "Settings",
    submenuItems: [
          {
            label: "Bank Accounts",
            link: "/bank-settings-grid",
            icon: "building-bank",
            showSubRoute: false,
          },
          { label: "Tax Rates", 
            link: "/tax-rates", 
            icon: "receipt-tax",
            showSubRoute: false },
          {
            label: "Currencies",
            link: "/currency-settings",
            icon: "currency-dollar",
            showSubRoute: false,
          },
      
      {
        label: "Logout",
        link: "/signin",
        icon: 'logout',
        showSubRoute: false,
      },
    ],
  },
];
