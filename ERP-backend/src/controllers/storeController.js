import Store from "../models/Store.js";
import { Country } from "../models/Location.js";
import { exportToExcel, exportToPDF, exportStoreDetailsToPDF } from "../utils/exportUtils.js";

/* GET /api/stores (List + Search + Filter + Sort + Pagination) */
export const getStores = async (req, res) => {
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

    const total = await Store.countDocuments(query);
    const stores = await Store.find(query)
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
      dataFound: stores.length > 0,
      data: stores.map(c => {
        // If country is a code try to get the name
        const countryDisplay = (c.country && c.country.length === 2)
          ? (countryMap[c.country] || c.country)
          : c.country;

        return {
          _id: c._id,
          id: c._id,
          code: c.code,
          name: c.name,
          username: c.username,
          plan: c.plan,
          planType: c.planType,
          email: c.email,
          phone: c.phone,
          address: c.address,
          city: c.city,
          state: c.state,
          country: countryDisplay,
          postalCode: c.postalCode,
          status: c.status,
          website: c.website,
          password: c.password,
          currency: c.currency,
          language: c.language,
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
      message: error.message || "Failed to retrieve stores",
      status: false,
      dataFound: false
    });
  }
};

/* POST /api/stores/add */
export const addStore = async (req, res) => {
  try {
    const {
      name,
      username,
      plan,
      planType,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      gstin,
      status,
      website,
      password,
      currency,
      language
    } = req.body;

    const lastStore = await Store.findOne({ code: { $exists: true } }).sort({ code: -1 });
    let newCode = "STO0001";
    if (lastStore && lastStore.code) {
      const lastNum = parseInt(lastStore.code.replace("STO", ""));
      newCode = `STO${String(lastNum + 1).padStart(4, "0")}`;
    }

    const store = new Store({
      code: newCode,
      name,
      username,
      plan,
      planType,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      gstin,
      status,
      website,
      password,
      currency,
      language
    });

    await store.save();

    res.status(201).json({
      message: "Store Created Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Store with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create store",
      status: false,
      dataFound: false
    });
  }
};

/* GET /api/stores/:id */
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        message: "Store Not Found",
        status: false,
        dataFound: false
      });
    }

    // If country is a code, try to get the name
    let countryDisplay = store.country;
    if (store.country && store.country.length === 2) {
      const country = await Country.findOne({ code: store.country });
      if (country) countryDisplay = country.name;
    }

    res.json({
      message: "Data Retrieved Successfully",
      status: true,
      dataFound: true,
      data: {
        id: store._id,
        code: store.code,
        name: store.name,
        username: store.username,
        plan: store.plan,
        planType: store.planType,
        email: store.email,
        phone: store.phone,
        address: store.address,
        city: store.city,
        state: store.state,
        country: countryDisplay,
        postalCode: store.postalCode,
        gstin: store.gstin,
        status: store.status,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to retrieve store",
      status: false,
      dataFound: false
    });
  }
};

/* PUT /api/stores/:id */
export const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      if (req.file) {
        deleteStoreImage(req.file.filename);
      }
      return res.status(404).json({
        message: "Store Not Found",
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
      if (store.avatar) {
        const filename = store.avatar.split('/').pop();
        deleteStoreImage(filename);
      }
      updateData.avatar = `/uploads/stores/${req.file.filename}`;
    }

    await Store.findByIdAndUpdate(req.params.id, updateData);

    res.json({
      message: "Store Details Updated Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {

    if (req.file) {
      deleteStoreImage(req.file.filename);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Store with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to update store",
      status: false,
      dataFound: false
    });
  }
};

/*PATCH /api/stores/:id/status*/

export const toggleStoreStatus = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({
        message: "Store Not Found",
        status: false,
        dataFound: false
      });
    }

    res.json({
      message: "Store Status Updated Successfully",
      status: true,
      dataFound: true,
      data: { id: store._id, status: store.status }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update status",
      status: false,
      dataFound: false
    });
  }
};

/*DELETE /api/stores/:id*/

export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        message: "Store Not Found",
        status: false,
        dataFound: false
      });
    }

    // Permanent Delete
    if (store.avatar) {
      const filename = store.avatar.split('/').pop();
      deleteStoreImage(filename);
    }

    await Store.findByIdAndDelete(req.params.id);

    res.json({
      message: "Store Deleted Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete store",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/stores/bulk-delete*/

export const bulkDeleteStores = async (req, res) => {
  try {
    const ids = req.body.ids;
    const stores = await Store.find({ _id: { $in: ids } });

    // Permanent Delete
    // Delete images first
    stores.forEach(store => {
      if (store.avatar) {
        const filename = store.avatar.split('/').pop();
        deleteStoreImage(filename);
      }
    });

    const result = await Store.deleteMany({ _id: { $in: ids } });

    res.json({
      message: "Stores Deleted Successfully",
      status: true,
      dataFound: true,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete stores",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/stores/bulk-update*/

export const bulkUpdateStores = async (req, res) => {
  try {
    const result = await Store.updateMany(
      { _id: { $in: req.body.ids } },
      { status: req.body.status }
    );

    res.json({
      message: "Stores Updated Successfully",
      status: true,
      dataFound: true,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update stores",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/stores/export*/

export const exportStores = async (req, res) => {
  try {
    const format = req.query.format;

    // Get all stores for export
    const stores = await Store.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Get all countries to map codes to names
    const countries = await Country.find({});
    const countryMap = countries.reduce((acc, c) => {
      acc[c.code] = c.name;
      return acc;
    }, {});

    const enrichedStores = stores.map(c => {
      const storeObj = c.toObject();
      if (storeObj.country && storeObj.country.length === 2) {
        storeObj.country = countryMap[storeObj.country] || storeObj.country;
      }
      return storeObj;
    });

    if (format === "xlsx") {
      const buffer = await exportToExcel(enrichedStores);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=stores-${Date.now()}.xlsx`);

      return res.send(buffer);
    }

    if (format === "pdf") {
      const buffer = await exportToPDF(enrichedStores);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=stores-${Date.now()}.pdf`);

      return res.send(buffer);
    }

    res.status(400).json({
      message: "Invalid export format. Use 'pdf' or 'xlsx'",
      status: false,
      dataFound: false
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to export stores",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/stores/:id/report*/

export const getStoreReport = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        message: "Store Not Found",
        status: false,
        dataFound: false
      });
    }

    // Get country name
    let countryDisplay = store.country;
    if (store.country && store.country.length === 2) {
      const country = await Country.findOne({ code: store.country });
      if (country) countryDisplay = country.name;
    }

    const storeObj = store.toObject();
    storeObj.country = countryDisplay;

    const buffer = await exportStoreDetailsToPDF(storeObj);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=store-report-${store.code}.pdf`);

    return res.send(buffer);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to generate report",
      status: false,
      dataFound: false
    });
  }
};

