import { StockAdjustmentService } from "../services/stock-adjustment.service";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { stockImg02 } from "../../utils/imagepath";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { WarehouseService } from "../services/warehouse.service";
import { StoreService } from "../services/store.service";
import { ProductService } from "../services/product.service";

const StockAdjustment = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<any>(0);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  const closeAddModalRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await StockAdjustmentService.getAll();
        if (res.status && res.data) {
          const formatted = res.data.map((item: any) => ({
            ...item,
            warehouseId: item.warehouse?._id || item.warehouse?.id,
            warehouse: item.warehouse?.name || "Unknown",
            store: item.store?.name || "Unknown",
            productName: item.product?.product || item.product?.name || "Unknown Product",
            productImage: item.product?.images && item.product.images.length > 0
              ? (item.product.images[0].url.startsWith("http") ? item.product.images[0].url : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${item.product.images[0].url}`)
              : (item.product?.image ? (item.product.image.startsWith("http") ? item.product.image : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${item.product.image}`) : stockImg02),
            personName: item.adjustedBy?.name || "Admin",
            personImage: stockImg02,
            date: new Date(item.date).toLocaleDateString(),
            qty: (item.adjustmentType === "Addition" ? "+" : "-") + item.quantity
          }));
          setListData(formatted);
          setTotalRecords(formatted.length);
        }
      } catch (error) {
        console.error("Error fetching stock adjustments", error);
      }
    };
    fetchData();
    fetchDropdowns();
  }, []);

  // Form State
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>("Addition");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");

  // Options State
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
  const [storeOptions, setStoreOptions] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);

  const personOptions = [
    { label: "Admin", value: "admin" } // Hardcoded fallback or use real user ID
  ];
  
  const typeOptions = [
    { label: "Addition", value: "Addition" },
    { label: "Subtraction", value: "Subtraction" },
  ];

  const fetchDropdowns = async () => {
    try {
      // Use high limit to get all records for dropdowns
      const [whRes, stRes, prRes] = await Promise.all([
        WarehouseService.getWarehouses({ limit: 1000, status: "Active" }),
        StoreService.getStores({ limit: 1000 }),
        ProductService.getAll({ limit: 1000 })
      ]);

      if (whRes?.data && Array.isArray(whRes.data)) {
        setWarehouseOptions(whRes.data.map((w: any) => ({ label: w.name, value: w._id || w.id })));
      }
      if (stRes?.data && Array.isArray(stRes.data)) {
        setStoreOptions(stRes.data.map((s: any) => ({ label: s.name, value: s._id || s.id })));
      }
      if (prRes?.data && Array.isArray(prRes.data)) {
        setProductOptions(prRes.data.map((p: any) => ({ label: p.product || p.name, value: p._id || p.id })));
      }
    } catch (error) {
      console.error("Error fetching dropdowns", error);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || !selectedStore || !selectedProduct || !quantity) {
      return;
    }
    
    try {
      const res = await StockAdjustmentService.create({
        warehouse: selectedWarehouse,
        store: selectedStore,
        product: selectedProduct,
        adjustmentType: selectedType,
        quantity: quantity,
        notes: notes,
      });
      
      if (res.status) {
        closeAddModalRef.current?.click();
        
        // Reset form
        setSelectedWarehouse(null);
        setSelectedStore(null);
        setSelectedProduct(null);
        setSelectedType("Addition");
        setQuantity(1);
        setNotes("");
        
        // Refresh list
        const updatedRes = await StockAdjustmentService.getAll();
        if (updatedRes.status && updatedRes.data) {
          const formatted = updatedRes.data.map((item: any) => ({
            ...item,
            warehouse: item.warehouse?.name || "Unknown",
            store: item.store?.name || "Unknown",
            productName: item.product?.product || item.product?.name || "Unknown Product",
            productImage: item.product?.images && item.product.images.length > 0
              ? (item.product.images[0].url.startsWith("http") ? item.product.images[0].url : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${item.product.images[0].url}`)
              : (item.product?.image ? (item.product.image.startsWith("http") ? item.product.image : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${item.product.image}`) : stockImg02),
            personName: item.adjustedBy?.name || "Admin",
            personImage: stockImg02,
            date: new Date(item.date).toLocaleDateString(),
            qty: (item.adjustmentType === "Addition" ? "+" : "-") + item.quantity
          }));
          setListData(formatted);
          setTotalRecords(formatted.length);
        }
      }
    } catch (error) {
      console.error("Failed to add adjustment", error);
    }
  };

  const columns = [
    { header: "Warehouse", field: "warehouse", key: "warehouse" },
    { header: "Store", field: "store", key: "store" },
    {
      header: "Product",
      field: "product",
      key: "product",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={data?.productImage} alt="product" />
          </Link>
          <Link to="#">{data?.productName}</Link>
        </div>
      ),
    },
    { header: "Date", field: "date", key: "date" },
    {
      header: "Person",
      field: "person",
      key: "person",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={data?.personImage} alt="product" />
          </Link>
          <Link to="#">{data?.personName}</Link>
        </div>
      ),
    },
    { header: "Qty", field: "qty", key: "qty" },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (_row: any) => (
        <div className="d-flex align-items-center edit-delete-action">
          <Link
            className="me-2 border rounded d-flex align-items-center p-2"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#view-notes"
          >
            <i className="feather icon-file-text" />
          </Link>
          <Link
            className="me-2 border rounded d-flex align-items-center p-2"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-stock-adjustment"
          >
            <i  className="feather icon-edit" />
          </Link>
          <Link
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            className="p-2 border rounded d-flex align-items-center"
            to="#"
          >
            <i className="feather icon-trash-2" />
          </Link>
        </div>
      ),
    },
  ];

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  // Filter state
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("recent");

  const filteredData = listData
    .filter((item: any) => {
      // Warehouse filter
      if (filterWarehouse && item.warehouseId !== filterWarehouse) return false;

      // Date-based filters
      if (sortOrder === "last7") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        if (new Date(item.createdAt) < cutoff) return false;
      }
      if (sortOrder === "lastMonth") {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 1);
        if (new Date(item.createdAt) < cutoff) return false;
      }

      // Search filter
      if (searchQuery && searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          item.productName?.toLowerCase().includes(q) ||
          item.warehouse?.toLowerCase().includes(q) ||
          item.store?.toLowerCase().includes(q) ||
          item.qty?.toString().toLowerCase().includes(q) ||
          item.date?.toLowerCase().includes(q)
        );
      }

      return true;
    })
    .sort((a: any, b: any) => {
      if (sortOrder === "asc") return (a.productName || "").localeCompare(b.productName || "");
      if (sortOrder === "desc") return (b.productName || "").localeCompare(a.productName || "");
      return 0;
    });


  return (
    <>
      {" "}
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Stock Adjustment</h4>
                <h6>Manage your stock adjustment</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-stock-adjustment"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Adjustment
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {filterWarehouse
                      ? warehouseOptions.find((w: any) => w.value === filterWarehouse)?.label || "Warehouse"
                      : "Warehouse"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setFilterWarehouse(null)}
                      >
                        All Warehouses
                      </Link>
                    </li>
                    {warehouseOptions.map((w: any) => (
                      <li key={w.value}>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => setFilterWarehouse(w.value)}
                        >
                          {w.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {
                      sortOrder === "asc" ? "Ascending" :
                      sortOrder === "desc" ? "Desending" :
                      sortOrder === "lastMonth" ? "Last Month" :
                      sortOrder === "last7" ? "Last 7 Days" :
                      "Recently Added"
                    }
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setSortOrder("recent")}>
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setSortOrder("asc")}>
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setSortOrder("desc")}>
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setSortOrder("lastMonth")}>
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setSortOrder("last7")}>
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
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>
      {/* Add Adjustment */}
      <div className="modal fade" id="add-stock-adjustment">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Adjustment</h4>
              </div>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleAddAdjustment}>
              <div className="modal-body">
                <div className="search-form mb-3">
                  <label className="form-label">
                    Product <span className="text-danger ms-1">*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #dee2e6', borderRadius: '6px', padding: '0 12px', background: '#fff' }}>
                    <i className="feather icon-search" style={{ color: '#aaa', fontSize: '16px', marginRight: '10px', flexShrink: 0 }} />
                    <input
                      type="text"
                      style={{ border: 'none', outline: 'none', width: '100%', padding: '10px 0', background: 'transparent', fontSize: '14px' }}
                      placeholder="Search Product"
                      value={selectedProduct ? (productOptions.find((p: any) => p.value === selectedProduct)?.label || '') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = productOptions.find((p: any) => p.label === val);
                        if (matched) {
                          setSelectedProduct(matched.value);
                        } else if (!val) {
                          setSelectedProduct(null);
                        }
                      }}
                      list="product-list"
                    />
                    <datalist id="product-list">
                      {productOptions.map((p: any) => (
                        <option key={p.value} value={p.label} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseOptions}
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.value)}
                        placeholder="Select"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Reference Number <span className="text-danger ms-1">*</span>
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Store <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={storeOptions}
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.value)}
                        placeholder="Select"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Responsible Person <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={personOptions}
                        value={selectedPerson}
                        onChange={(e) => setSelectedPerson(e.value)}
                        placeholder="Select"
                        filter={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Notes <span className="text-danger ms-1">*</span>
                    </label>
                    <textarea 
                      className="form-control" 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-dark me-2"
                  data-bs-dismiss="modal"
                  ref={closeAddModalRef}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning text-white">
                  Create Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Adjustment */}
      {/* Edit Adjustment */}
      <div className="modal fade" id="edit-stock-adjustment">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Adjustment</h4>
              </div>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="mb-3 search-form">
                  <label className="form-label">
                    Product<span className="text-danger ms-1">*</span>
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      defaultValue="Nike Jordan"
                    />
                    <i className="feather icon-search feather-search" />
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseOptions}
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.value)}
                        placeholder="Select Warehouse"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Reference Number
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="PT003"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="p-3 border bg-light rounded mb-3">
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU</th>
                              <th>Category</th>
                              <th>Qty</th>
                              <th>Type</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link
                                    to="#"
                                    className="avatar avatar-md me-2"
                                  >
                                    <img src={stockImg02} alt="product" />
                                  </Link>
                                  <Link to="#">Nike Jordan</Link>
                                </div>
                              </td>
                              <td>PT002</td>
                              <td>Nike</td>
                              <td>
                                <div className="product-quantity border-0 bg-gray-transparent">
                                  <span className="quantity-btn">
                                    <i className="feather icon-minus-circle feather-search" />
                                  </span>
                                  <input
                                    type="text"
                                    className="quntity-input bg-transparent"
                                    defaultValue={2}
                                  />
                                  <span className="quantity-btn">
                                    +
                                    <i
                                      
                                      className="feather icon-plus-circle plus-circle"
                                    />
                                  </span>
                                </div>
                              </td>
                              <td>
                                <CommonSelect
                                  className="w-100"
                                  options={typeOptions}
                                  value={selectedType}
                                  onChange={(e) => setSelectedType(e.value)}
                                  placeholder="Select"
                                  filter={false}
                                />
                              </td>
                              <td>
                                <div className="edit-delete-action d-flex align-items-center">
                                  <Link
                                    className="p-2 border rounded d-flex align-items-center"
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete"
                                  >
                                    <i className="feather icon-trash-2" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Store<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={storeOptions}
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.value)}
                        placeholder="Select Store"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Responsible Person
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={personOptions}
                        value={selectedPerson}
                        onChange={(e) => setSelectedPerson(e.value)}
                        placeholder="Select Person"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Notes<span className="text-danger ms-1">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        defaultValue={
                          "The Jordan brand is owned by Nike (owned by the Knight family), as, at the time, the company was building its strategy to work with athletes to launch shows that could inspire consumers.Although Jordan preferred Converse and Adidas, they simply could not match the offer Nike made. "
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Adjustment */}
      {/* View Notes */}
      <div className="modal fade" id="view-notes">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Notes</h4>
              </div>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <p>
                The Jordan brand is owned by Nike (owned by the Knight family),
                as, at the time, the company was building its strategy to work
                with athletes to launch shows that could inspire
                consumers.Although Jordan preferred Converse and Adidas, they
                simply could not match the offer Nike made. Jordan also signed
                with Nike because he loved the way they wanted to market him
                with the banned colored shoes. Nike promised to cover the fine
                Jordan would receive from the NBA.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* /View Notes */}
      <DeleteModal />
    </>
  );
};

export default StockAdjustment;
