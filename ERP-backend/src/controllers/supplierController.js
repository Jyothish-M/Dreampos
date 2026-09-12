import Supplier from "../models/Supplier.js";
import { Country } from "../models/Location.js";
import { exportToExcel, exportToPDF, exportSupplierDetailsToPDF } from "../utils/exportUtils.js";

/* GET /api/suppliers (List + Search + Filter + Sort + Pagination) */
export const getSuppliers = async (req, res) => {
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

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
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
      dataFound: suppliers.length > 0,
       data: suppliers.map(c => {
         // If country is a code try to get the name
         const countryDisplay = (c.country && c.country.length === 2)
           ? (countryMap[c.country] || c.country)
           : c.country;
 
         return {
           _id: c._id,
           id: c._id,
           code: c.code,
           name: c.name,
           email: c.email,
           phone: c.phone,
           address: c.address,
           city: c.city,
           state: c.state,
           country: countryDisplay,
           postalCode: c.postalCode,
           gstin: c.gstin,
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
      message: error.message || "Failed to retrieve suppliers",
      status: false,
      dataFound: false
    });
  }
};

/* POST /api/suppliers/add */
export const addSupplier = async (req, res) => {
  try {
    const lastSupplier = await Supplier.findOne().sort({ code: -1 }).select('code');
    let nextNumber = 1;

    if (lastSupplier && lastSupplier.code) {
      const lastNumber = parseInt(lastSupplier.code.replace('SU', ''));
      nextNumber = lastNumber + 1;
    }

    const code = `SU${String(nextNumber).padStart(3, "0")}`;

    const supplierData = { ...req.body, code };

    // Remove empty/null optional fields entirely to support sparse unique index
    if (!supplierData.email || supplierData.email.trim() === "") delete supplierData.email;
    if (!supplierData.phone || supplierData.phone.trim() === "") delete supplierData.phone;
    if (!supplierData.gstin || supplierData.gstin.trim() === "") delete supplierData.gstin;

    await Supplier.create(supplierData);

    res.status(201).json({
      message: "Supplier Created Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Supplier with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create supplier",
      status: false,
      dataFound: false
    });
  }
};

/* GET /api/suppliers/:id */
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier Not Found",
        status: false,
        dataFound: false
      });
    }

    // If country is a code, try to get the name
    let countryDisplay = supplier.country;
    if (supplier.country && supplier.country.length === 2) {
      const country = await Country.findOne({ code: supplier.country });
      if (country) countryDisplay = country.name;
    }

    res.json({
      message: "Data Retrieved Successfully",
      status: true,
      dataFound: true,
      data: {
        _id: supplier._id,
        id: supplier._id,
        code: supplier.code,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        country: countryDisplay,
        postalCode: supplier.postalCode,
        gstin: supplier.gstin,
        status: supplier.status,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to retrieve supplier",
      status: false,
      dataFound: false
    });
  }
};

/* PUT /api/suppliers/:id */
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier Not Found",
        status: false,
        dataFound: false
      });
    }

    const updateData = { ...req.body };

    // Remove empty/null optional fields
    if (!updateData.email || updateData.email.trim() === "") delete updateData.email;
    if (!updateData.phone || updateData.phone.trim() === "") delete updateData.phone;
    if (!updateData.gstin || updateData.gstin.trim() === "") delete updateData.gstin;

    await Supplier.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({
      message: "Supplier Details Updated Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Supplier with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to update supplier",
      status: false,
      dataFound: false
    });
  }
};

/*PATCH /api/suppliers/:id/status*/

export const toggleSupplierStatus = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier Not Found",
        status: false,
        dataFound: false
      });
    }

    res.json({
      message: "Supplier Status Updated Successfully",
      status: true,
      dataFound: true,
      data: { id: supplier._id, status: supplier.status }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update status",
      status: false,
      dataFound: false
    });
  }
};

/*DELETE /api/suppliers/:id*/

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier Not Found",
        status: false,
        dataFound: false
      });
    }

    // Permanent Delete
    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      message: "Supplier Deleted Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete supplier",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/suppliers/bulk-delete*/

export const bulkDeleteSuppliers = async (req, res) => {
  try {
    const ids = req.body.ids;
    const suppliers = await Supplier.find({ _id: { $in: ids } });

    // Permanent Delete
    const result = await Supplier.deleteMany({ _id: { $in: ids } });

    res.json({
      message: "Suppliers Deleted Successfully",
      status: true,
      dataFound: true,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete suppliers",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/suppliers/bulk-update*/

export const bulkUpdateSuppliers = async (req, res) => {
  try {
    const result = await Supplier.updateMany(
      { _id: { $in: req.body.ids } },
      { status: req.body.status }
    );

    res.json({
      message: "Suppliers Updated Successfully",
      status: true,
      dataFound: true,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update suppliers",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/suppliers/export*/

export const exportSuppliers = async (req, res) => {
  try {
    const format = req.query.format;

    // Get all suppliers for export
    const suppliers = await Supplier.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Get all countries to map codes to names
    const countries = await Country.find({});
    const countryMap = countries.reduce((acc, c) => {
      acc[c.code] = c.name;
      return acc;
    }, {});

    const enrichedSuppliers = suppliers.map(c => {
      const supplierObj = c.toObject();
      if (supplierObj.country && supplierObj.country.length === 2) {
        supplierObj.country = countryMap[supplierObj.country] || supplierObj.country;
      }
      return supplierObj;
    });

    if (format === "xlsx") {
      const buffer = await exportToExcel(enrichedSuppliers);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=suppliers-${Date.now()}.xlsx`);

      return res.send(buffer);
    }

    if (format === "pdf") {
      const buffer = await exportToPDF(enrichedSuppliers);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=suppliers-${Date.now()}.pdf`);

      return res.send(buffer);
    }

    res.status(400).json({
      message: "Invalid export format. Use 'pdf' or 'xlsx'",
      status: false,
      dataFound: false
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to export suppliers",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/suppliers/:id/report*/

export const getSupplierReport = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier Not Found",
        status: false,
        dataFound: false
      });
    }

    // Get country name
    let countryDisplay = supplier.country;
    if (supplier.country && supplier.country.length === 2) {
      const country = await Country.findOne({ code: supplier.country });
      if (country) countryDisplay = country.name;
    }

    const supplierObj = supplier.toObject();
    supplierObj.country = countryDisplay;

    const buffer = await exportSupplierDetailsToPDF(supplierObj);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=supplier-report-${supplier.code}.pdf`);

    return res.send(buffer);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to generate report",
      status: false,
      dataFound: false
    });
  }
};

