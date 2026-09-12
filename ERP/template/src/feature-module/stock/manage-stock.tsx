import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { StockService } from "../services/stock.service";
import { WarehouseService } from "../services/warehouse.service";
import { StoreService } from "../services/store.service";
import { ProductService } from "../services/product.service";
import TableTopHead from "../../components/table-top-head";
import { stockImg02 } from "../../utils/imagepath";
import CommonSelect from "../../components/select/common-select";
import CommonFooter from "../../components/footer/commonFooter";

const ManageStock = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [_totalRecords, setTotalRecords] = useState<any>(0);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Dynamic dropdown data from backend
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
  const [storeOptions, setStoreOptions] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);

  // Filter states
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string | null>(null);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string | null>(null);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string | null>(null);

  // Add Stock form state
  const [addWarehouse, setAddWarehouse] = useState<any>(null);
  const [addStore, setAddStore] = useState<any>(null);
  const [addProduct, setAddProduct] = useState<any>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);

  // Delete state
  const [deleteId, setDeleteId] = useState<string>("");

  // Ref to programmatically close the Add Stock modal
  const closeAddStockRef = useRef<HTMLButtonElement>(null);

  // Fetch stock data from backend
  const fetchStockData = async () => {
    try {
      const res = await StockService.getAll();
      if (res.status && res.data) {
        const formatted = res.data.map((item: any) => ({
          ...item,
          warehouseId: item.warehouse?._id || item.warehouse?.id,
          warehouse: item.warehouse?.name || "Unknown",
          storeId: item.store?._id || item.store?.id,
          store: item.store?.name || "Unknown",
          productId: item.product?._id || item.product?.id,
          productName: item.product?.product || item.product?.name || "Unknown Product",
          productImage: item.product?.images && item.product.images.length > 0
            ? (item.product.images[0].url.startsWith("http") ? item.product.images[0].url : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${item.product.images[0].url}`)
            : (item.product?.image ? (item.product.image.startsWith("http") ? item.product.image : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${item.product.image}`) : stockImg02),
          personName: item.lastUpdatedBy?.name || "Admin",
          personImage: stockImg02,
          date: new Date(item.updatedAt).toLocaleDateString(),
          qty: item.quantity
        }));
        setListData(formatted);
        setTotalRecords(formatted.length);
      }
    } catch (error) {
      console.error("Error fetching stocks", error);
    }
  };

  // Fetch dropdown data from backend
  const fetchDropdowns = async () => {
    try {
      const [whRes, stRes, prRes] = await Promise.all([
        WarehouseService.getWarehouses({ limit: 0 }),
        StoreService.getStores({ limit: 0 }),
        ProductService.getAll({ limit: 0 })
      ]);

      if (whRes.status && whRes.data) {
        setWarehouseOptions(whRes.data.map((w: any) => ({ label: w.name, value: w._id })));
      }
      if (stRes.status && stRes.data) {
        setStoreOptions(stRes.data.map((s: any) => ({ label: s.name, value: s._id })));
      }
      if (prRes.data) {
        setProductOptions(prRes.data.map((p: any) => ({ label: p.product || p.name, value: p.id || p._id })));
      }
    } catch (error) {
      console.error("Error fetching dropdowns", error);
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchDropdowns();
  }, []);

  // Handle Add Stock
  const handleAddStock = async (e: any) => {
    e.preventDefault();
    if (!addWarehouse || !addStore || !addProduct || !addQuantity) return;
    try {
      const res = await StockService.create({
        warehouse: addWarehouse,
        store: addStore,
        product: addProduct,
        quantity: addQuantity
      });
      if (res.status) {
        // Close modal by clicking the hidden close button
        closeAddStockRef.current?.click();
        // Reset form
        setAddWarehouse(null);
        setAddStore(null);
        setAddProduct(null);
        setAddQuantity(1);
        // Refresh data
        fetchStockData();
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  // Handle Delete Stock
  const handleDeleteStock = async () => {
    if (!deleteId) return;
    try {
      const res = await StockService.delete(deleteId);
      if (res.status) {
        setDeleteId("");
        fetchStockData();
      }
    } catch (error: any) {
      console.error(error);
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
            <img src={data?.personImage} alt="person" />
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
      body: (row: any) => (
        <div className="d-flex align-items-center edit-delete-action">
          <Link
            className="p-2 border rounded d-flex align-items-center"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row._id)}
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

  const filteredData = listData.filter((item: any) => {
    if (selectedWarehouseFilter && item.warehouseId !== selectedWarehouseFilter) return false;
    if (selectedStoreFilter && item.storeId !== selectedStoreFilter) return false;
    if (selectedProductFilter && item.productId !== selectedProductFilter) return false;
    return true;
  });

  return (
    <>
      {" "}
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Manage Stock</h4>
                <h6>Manage your stock</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-stock"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Stock
              </Link>
            </div>
          </div>
          {/* /product list */}
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
                    {selectedWarehouseFilter ? warehouseOptions.find(w => w.value === selectedWarehouseFilter)?.label : "Warehouse"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" onClick={() => setSelectedWarehouseFilter(null)} className="dropdown-item rounded-1">
                        All Warehouses
                      </Link>
                    </li>
                    {warehouseOptions.map((w: any) => (
                      <li key={w.value}>
                        <Link to="#" onClick={() => setSelectedWarehouseFilter(w.value)} className="dropdown-item rounded-1">
                          {w.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {selectedStoreFilter ? storeOptions.find(s => s.value === selectedStoreFilter)?.label : "Store"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" onClick={() => setSelectedStoreFilter(null)} className="dropdown-item rounded-1">
                        All Stores
                      </Link>
                    </li>
                    {storeOptions.map((s: any) => (
                      <li key={s.value}>
                        <Link to="#" onClick={() => setSelectedStoreFilter(s.value)} className="dropdown-item rounded-1">
                          {s.label}
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
                    {selectedProductFilter ? productOptions.find(p => p.value === selectedProductFilter)?.label : "Product"}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" onClick={() => setSelectedProductFilter(null)} className="dropdown-item rounded-1">
                        All Products
                      </Link>
                    </li>
                    {productOptions.map((p: any) => (
                      <li key={p.value}>
                        <Link to="#" onClick={() => setSelectedProductFilter(p.value)} className="dropdown-item rounded-1">
                          {p.label}
                        </Link>
                      </li>
                    ))}
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
                  totalRecords={filteredData.length}
                  searchQuery={searchQuery}
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
      {/* Add Stock */}
      <div className="modal fade" id="add-stock">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Stock</h4>
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
            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseOptions}
                        value={addWarehouse}
                        onChange={(e) => setAddWarehouse(e.value)}
                        placeholder="Select Warehouse"
                        filter={false}
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
                        value={addStore}
                        onChange={(e) => setAddStore(e.value)}
                        placeholder="Select Store"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Product <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={productOptions}
                        value={addProduct}
                        onChange={(e) => setAddProduct(e.value)}
                        placeholder="Select Product"
                        filter={true}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Quantity <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(Number(e.target.value))}
                        placeholder="Enter quantity"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  ref={closeAddStockRef}
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Stock */}
      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="delete-icon">
                <i className="ti ti-trash-x" />
              </span>
              <h4>Confirm Deletion</h4>
              <p>Are you sure you want to delete this stock entry?</p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-secondary me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  data-bs-dismiss="modal"
                  onClick={handleDeleteStock}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}
    </>
  );
};

export default ManageStock;
