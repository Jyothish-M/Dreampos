import Warehouse from "../models/Warehouse.js";
import { Country } from "../models/Location.js";
import { deleteWarehouseImage } from "../middleware/uploadMiddleware.js";
import { exportToExcel, exportToPDF, exportWarehouseDetailsToPDF } from "../utils/exportUtils.js";

/* GET /api/warehouses (List + Search + Filter + Sort + Pagination) */
export const getWarehouses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;

    const query = { isDeleted: { $ne: true } };
    if (search) {
      // Escape special characters for regex
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, "i");

      // Find country codes matching search term to include in search
      const matchingCountries = await Country.find({
        name: { $regex: search, $options: "i" }
      });
      const countryCodes = matchingCountries.map(c => c.code);

      query.$or = [
        { name: searchRegex },
        
        { email: searchRegex },
        { phone: searchRegex },
        { code: searchRegex },
        { address: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { country: searchRegex },
        { postalCode: searchRegex },
        { gstin: searchRegex },
        ...(countryCodes.length > 0 ? [{ country: { $in: countryCodes } }] : []),
        // Full name search
        {
          $expr: {
            $regexMatch: {
              input: "$name",
              regex: search,
              options: "i"
            }
          }
        }
      ];
    }
    if (status) query.status = status;

    const total = await Warehouse.countDocuments(query);
    const warehouses = await Warehouse.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get all countries to map codes to names
    const countries = await Country.find({});
    const countryMap = countries.reduce((acc, c) => {
      acc[c.code] = c.name;
      return acc;
    }, {});

    res.json({
      message: "Data Retrieved Successfully",
      status: true,
      dataFound: warehouses.length > 0,
       data: warehouses.map(c => {
         // If country is a code try to get the name
         const countryDisplay = (c.country && c.country.length === 2)
           ? (countryMap[c.country] || c.country)
           : c.country;
 
         return {
           _id: c._id,
           id: c._id,
           code: c.code,
           name: c.name,
           contactPerson: c.contactPerson,
           email: c.email,
           phone: c.phone,
           address: c.address,
           city: c.city,
           state: c.state,
           country: countryDisplay,
           postalCode: c.postalCode,
           gstin: c.gstin,
           avatar: c.avatar,
           status: c.status,
           createdAt: c.createdAt
         };
       }),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to retrieve warehouses",
      status: false,
      dataFound: false
    });
  }
};

/* POST /api/warehouses/add */
export const addWarehouse = async (req, res) => {
  try {
    const lastWarehouse = await Warehouse.findOne().sort({ code: -1 }).select('code');
    let nextNumber = 1;

    if (lastWarehouse && lastWarehouse.code) {
      const lastNumber = parseInt(lastWarehouse.code.replace('WA', ''));
      nextNumber = lastNumber + 1;
    }

    const code = `WA${String(nextNumber).padStart(3, "0")}`;

    const warehouseData = { ...req.body, code };

    // Remove empty/null optional fields entirely to support sparse unique index
    if (!warehouseData.email || warehouseData.email.trim() === "") delete warehouseData.email;
    if (!warehouseData.phone || warehouseData.phone.trim() === "") delete warehouseData.phone;
    if (!warehouseData.gstin || warehouseData.gstin.trim() === "") delete warehouseData.gstin;

    if (req.file) {
      warehouseData.avatar = `/uploads/warehouses/${req.file.filename}`;
    }

    await Warehouse.create(warehouseData);

    res.status(201).json({
      message: "Warehouse Created Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    if (req.file) {
      deleteWarehouseImage(req.file.filename);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Warehouse with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create warehouse",
      status: false,
      dataFound: false
    });
  }
};

/* GET /api/warehouses/:id */
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse Not Found",
        status: false,
        dataFound: false
      });
    }

    // If country is a code, try to get the name
    let countryDisplay = warehouse.country;
    if (warehouse.country && warehouse.country.length === 2) {
      const country = await Country.findOne({ code: warehouse.country });
      if (country) countryDisplay = country.name;
    }

    res.json({
      message: "Data Retrieved Successfully",
      status: true,
      dataFound: true,
      data: {
        _id: warehouse._id,
        id: warehouse._id,
        code: warehouse.code,
        name: warehouse.name,
        contactPerson: warehouse.contactPerson,
        email: warehouse.email,
        phone: warehouse.phone,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        country: countryDisplay,
        postalCode: warehouse.postalCode,
        gstin: warehouse.gstin,
        avatar: warehouse.avatar,
        status: warehouse.status,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to retrieve warehouse",
      status: false,
      dataFound: false
    });
  }
};

/* PUT /api/warehouses/:id */
export const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      if (req.file) {
        deleteWarehouseImage(req.file.filename);
      }
      return res.status(404).json({
        message: "Warehouse Not Found",
        status: false,
        dataFound: false
      });
    }

    const updateData = { ...req.body };

    // Remove empty/null optional fields
    if (!updateData.email || updateData.email.trim() === "") delete updateData.email;
    if (!updateData.phone || updateData.phone.trim() === "") delete updateData.phone;
    if (!updateData.gstin || updateData.gstin.trim() === "") delete updateData.gstin;

    // Handle new image upload
    if (req.file) {
      // Delete old image if exists
      if (warehouse.avatar) {
        const filename = warehouse.avatar.split('/').pop();
        deleteWarehouseImage(filename);
      }
      updateData.avatar = `/uploads/warehouses/${req.file.filename}`;
    }

    await Warehouse.findByIdAndUpdate(req.params.id, updateData);

    res.json({
      message: "Warehouse Details Updated Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {

    if (req.file) {
      deleteWarehouseImage(req.file.filename);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Warehouse with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to update warehouse",
      status: false,
      dataFound: false
    });
  }
};

/*PATCH /api/warehouses/:id/status*/

export const toggleWarehouseStatus = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse Not Found",
        status: false,
        dataFound: false
      });
    }

    res.json({
      message: "Warehouse Status Updated Successfully",
      status: true,
      dataFound: true,
      data: { id: warehouse._id, status: warehouse.status }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update status",
      status: false,
      dataFound: false
    });
  }
};

/*DELETE /api/warehouses/:id*/

export const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse Not Found",
        status: false,
        dataFound: false
      });
    }

    // Permanent Delete
    if (warehouse.avatar) {
      const filename = warehouse.avatar.split('/').pop();
      deleteWarehouseImage(filename);
    }

    await Warehouse.findByIdAndDelete(req.params.id);

    res.json({
      message: "Warehouse Deleted Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete warehouse",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/warehouses/bulk-delete*/

export const bulkDeleteWarehouses = async (req, res) => {
  try {
    const ids = req.body.ids;
    const warehouses = await Warehouse.find({ _id: { $in: ids } });

    // Permanent Delete
    // Delete images first
    warehouses.forEach(warehouse => {
      if (warehouse.avatar) {
        const filename = warehouse.avatar.split('/').pop();
        deleteWarehouseImage(filename);
      }
    });

    const result = await Warehouse.deleteMany({ _id: { $in: ids } });

    res.json({
      message: "Warehouses Deleted Successfully",
      status: true,
      dataFound: true,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete warehouses",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/warehouses/bulk-update*/

export const bulkUpdateWarehouses = async (req, res) => {
  try {
    const result = await Warehouse.updateMany(
      { _id: { $in: req.body.ids } },
      { status: req.body.status }
    );

    res.json({
      message: "Warehouses Updated Successfully",
      status: true,
      dataFound: true,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update warehouses",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/warehouses/export*/

export const exportWarehouses = async (req, res) => {
  try {
    const format = req.query.format;

    // Get all warehouses for export
    const warehouses = await Warehouse.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Get all countries to map codes to names
    const countries = await Country.find({});
    const countryMap = countries.reduce((acc, c) => {
      acc[c.code] = c.name;
      return acc;
    }, {});

    const enrichedWarehouses = warehouses.map(c => {
      const warehouseObj = c.toObject();
      if (warehouseObj.country && warehouseObj.country.length === 2) {
        warehouseObj.country = countryMap[warehouseObj.country] || warehouseObj.country;
      }
      return warehouseObj;
    });

    if (format === "xlsx") {
      const buffer = await exportToExcel(enrichedWarehouses);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=warehouses-${Date.now()}.xlsx`);

      return res.send(buffer);
    }

    if (format === "pdf") {
      const buffer = await exportToPDF(enrichedWarehouses);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=warehouses-${Date.now()}.pdf`);

      return res.send(buffer);
    }

    res.status(400).json({
      message: "Invalid export format. Use 'pdf' or 'xlsx'",
      status: false,
      dataFound: false
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to export warehouses",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/warehouses/:id/report*/

export const getWarehouseReport = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse Not Found",
        status: false,
        dataFound: false
      });
    }

    // Get country name
    let countryDisplay = warehouse.country;
    if (warehouse.country && warehouse.country.length === 2) {
      const country = await Country.findOne({ code: warehouse.country });
      if (country) countryDisplay = country.name;
    }

    const warehouseObj = warehouse.toObject();
    warehouseObj.country = countryDisplay;

    const buffer = await exportWarehouseDetailsToPDF(warehouseObj);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=warehouse-report-${warehouse.code}.pdf`);

    return res.send(buffer);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to generate report",
      status: false,
      dataFound: false
    });
  }
};

