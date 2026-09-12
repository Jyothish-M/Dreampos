import Customer from "../models/Customer.js";
import { Country } from "../models/Location.js";
import { deleteCustomerImage } from "../middleware/uploadMiddleware.js";
import { exportToExcel, exportToPDF, exportCustomerDetailsToPDF } from "../utils/exportUtils.js";

/* GET /api/customers (List + Search + Filter + Sort + Pagination) */
export const getCustomers = async (req, res) => {
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
        { firstName: searchRegex },
        { lastName: searchRegex },
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
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: search,
              options: "i"
            }
          }
        }
      ];
    }
    if (status) query.status = status;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
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
      dataFound: customers.length > 0,
      data: customers.map(c => {
        // If country is a code try to get the name
        const countryDisplay = (c.country && c.country.length === 2)
          ? (countryMap[c.country] || c.country)
          : c.country;

        return {
          id: c._id,
          code: c.code,
          customer: `${c.firstName} ${c.lastName || ""}`.trim(),
          firstName: c.firstName,
          lastName: c.lastName,
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
      message: error.message || "Failed to retrieve customers",
      status: false,
      dataFound: false
    });
  }
};

/* POST /api/customers/add */
export const addCustomer = async (req, res) => {
  try {
    const lastCustomer = await Customer.findOne().sort({ code: -1 }).select('code');
    let nextNumber = 1;

    if (lastCustomer && lastCustomer.code) {
      const lastNumber = parseInt(lastCustomer.code.replace('CU', ''));
      nextNumber = lastNumber + 1;
    }

    const code = `CU${String(nextNumber).padStart(3, "0")}`;

    const customerData = { ...req.body, code };

    // Remove empty/null optional fields entirely to support sparse unique index
    if (!customerData.email || customerData.email.trim() === "") delete customerData.email;
    if (!customerData.phone || customerData.phone.trim() === "") delete customerData.phone;
    if (!customerData.gstin || customerData.gstin.trim() === "") delete customerData.gstin;

    if (req.file) {
      customerData.avatar = `/uploads/customers/${req.file.filename}`;
    }

    await Customer.create(customerData);

    res.status(201).json({
      message: "Customer Created Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    if (req.file) {
      deleteCustomerImage(req.file.filename);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Customer with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create customer",
      status: false,
      dataFound: false
    });
  }
};

/* GET /api/customers/:id */
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer Not Found",
        status: false,
        dataFound: false
      });
    }

    // If country is a code, try to get the name
    let countryDisplay = customer.country;
    if (customer.country && customer.country.length === 2) {
      const country = await Country.findOne({ code: customer.country });
      if (country) countryDisplay = country.name;
    }

    res.json({
      message: "Data Retrieved Successfully",
      status: true,
      dataFound: true,
      data: {
        id: customer._id,
        code: customer.code,
        customer: `${customer.firstName} ${customer.lastName}`,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        country: countryDisplay,
        postalCode: customer.postalCode,
        gstin: customer.gstin,
        avatar: customer.avatar,
        status: customer.status,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to retrieve customer",
      status: false,
      dataFound: false
    });
  }
};

/* PUT /api/customers/:id */
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      if (req.file) {
        deleteCustomerImage(req.file.filename);
      }
      return res.status(404).json({
        message: "Customer Not Found",
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
      if (customer.avatar) {
        const filename = customer.avatar.split('/').pop();
        deleteCustomerImage(filename);
      }
      updateData.avatar = `/uploads/customers/${req.file.filename}`;
    }

    await Customer.findByIdAndUpdate(req.params.id, updateData);

    res.json({
      message: "Customer Details Updated Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {

    if (req.file) {
      deleteCustomerImage(req.file.filename);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Customer with this ${field} already exists`,
        status: false,
        dataFound: false
      });
    }

    res.status(500).json({
      message: error.message || "Failed to update customer",
      status: false,
      dataFound: false
    });
  }
};

/*PATCH /api/customers/:id/status*/

export const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer Not Found",
        status: false,
        dataFound: false
      });
    }

    res.json({
      message: "Customer Status Updated Successfully",
      status: true,
      dataFound: true,
      data: { id: customer._id, status: customer.status }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update status",
      status: false,
      dataFound: false
    });
  }
};

/*DELETE /api/customers/:id*/

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer Not Found",
        status: false,
        dataFound: false
      });
    }

    // Permanent Delete
    if (customer.avatar) {
      const filename = customer.avatar.split('/').pop();
      deleteCustomerImage(filename);
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      message: "Customer Deleted Successfully",
      status: true,
      dataFound: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete customer",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/customers/bulk-delete*/

export const bulkDeleteCustomers = async (req, res) => {
  try {
    const ids = req.body.ids;
    const customers = await Customer.find({ _id: { $in: ids } });

    // Permanent Delete
    // Delete images first
    customers.forEach(customer => {
      if (customer.avatar) {
        const filename = customer.avatar.split('/').pop();
        deleteCustomerImage(filename);
      }
    });

    const result = await Customer.deleteMany({ _id: { $in: ids } });

    res.json({
      message: "Customers Deleted Successfully",
      status: true,
      dataFound: true,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete customers",
      status: false,
      dataFound: false
    });
  }
};

/*POST /api/customers/bulk-update*/

export const bulkUpdateCustomers = async (req, res) => {
  try {
    const result = await Customer.updateMany(
      { _id: { $in: req.body.ids } },
      { status: req.body.status }
    );

    res.json({
      message: "Customers Updated Successfully",
      status: true,
      dataFound: true,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update customers",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/customers/export*/

export const exportCustomers = async (req, res) => {
  try {
    const format = req.query.format;

    // Get all customers for export
    const customers = await Customer.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Get all countries to map codes to names
    const countries = await Country.find({});
    const countryMap = countries.reduce((acc, c) => {
      acc[c.code] = c.name;
      return acc;
    }, {});

    const enrichedCustomers = customers.map(c => {
      const customerObj = c.toObject();
      if (customerObj.country && customerObj.country.length === 2) {
        customerObj.country = countryMap[customerObj.country] || customerObj.country;
      }
      return customerObj;
    });

    if (format === "xlsx") {
      const buffer = await exportToExcel(enrichedCustomers);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=customers-${Date.now()}.xlsx`);

      return res.send(buffer);
    }

    if (format === "pdf") {
      const buffer = await exportToPDF(enrichedCustomers);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=customers-${Date.now()}.pdf`);

      return res.send(buffer);
    }

    res.status(400).json({
      message: "Invalid export format. Use 'pdf' or 'xlsx'",
      status: false,
      dataFound: false
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to export customers",
      status: false,
      dataFound: false
    });
  }
};

/*GET /api/customers/:id/report*/

export const getCustomerReport = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer Not Found",
        status: false,
        dataFound: false
      });
    }

    // Get country name
    let countryDisplay = customer.country;
    if (customer.country && customer.country.length === 2) {
      const country = await Country.findOne({ code: customer.country });
      if (country) countryDisplay = country.name;
    }

    const customerObj = customer.toObject();
    customerObj.country = countryDisplay;

    const buffer = await exportCustomerDetailsToPDF(customerObj);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=customer-report-${customer.code}.pdf`);

    return res.send(buffer);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to generate report",
      status: false,
      dataFound: false
    });
  }
};

