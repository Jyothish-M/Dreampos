import Joi from "joi";

// Customer validation schema
const customerSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
        "string.empty": "First name is required",
        "string.min": "First name must be at least 2 characters",
        "string.max": "First name cannot exceed 50 characters"
    }),
    lastName: Joi.string().allow("", null).optional(),
    email: Joi.string().email().allow("", null).optional().messages({
        "string.email": "Please provide a valid email address"
    }),
    phone: Joi.string().pattern(/^\+?[0-9\s-]{10,20}$/).allow("", null).optional().messages({
        "string.pattern.base": "Phone number must be 10-20 characters (digits, spaces, dashes or +)"
    }),
    address: Joi.string().max(200).allow("").optional(),
    city: Joi.string().max(50).allow("").optional(),
    state: Joi.string().max(50).allow("").optional(),
    country: Joi.string().max(50).allow("").optional(),
    postalCode: Joi.string().pattern(/^[A-Za-z0-9\s-]{3,10}$/).allow("", null).optional().messages({
        "string.pattern.base": "Invalid postal code format"
    }),
    gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).allow("", null).optional().messages({
        "string.pattern.base": "Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)"
    }),
    status: Joi.string().valid("Active", "Inactive").default("Active"),
    avatar: Joi.string().allow("").optional()
});

// Update schema 
const customerUpdateSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().allow("").optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[0-9\s-]{10,20}$/).allow("").optional(),
    address: Joi.string().max(200).allow("").optional(),
    city: Joi.string().max(50).allow("").optional(),
    state: Joi.string().max(50).allow("").optional(),
    country: Joi.string().max(50).allow("").optional(),
    postalCode: Joi.string().pattern(/^[A-Za-z0-9\s-]{3,10}$/).allow("").optional(),
    gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).allow("").optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    avatar: Joi.string().allow("").optional()
});

// Validation middleware
export const validateCustomer = (req, res, next) => {
    // Sanitize empty strings to undefined (remove field) to prevent unique key errors
    if (req.body.email === "" || req.body.email === null) delete req.body.email;
    if (req.body.phone === "" || req.body.phone === null) delete req.body.phone;
    if (req.body.gstin === "" || req.body.gstin === null) delete req.body.gstin;

    const { error } = customerSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.reduce((acc, curr) => {
            acc[curr.path[0]] = curr.message;
            return acc;
        }, {});

        return res.status(400).json({
            message: "Validation failed",
            status: false,
            dataFound: false,
            errors
        });
    }

    next();
};

export const validateCustomerUpdate = (req, res, next) => {
    // Sanitize empty strings to undefined (remove field)
    if (req.body.email === "" || req.body.email === null) delete req.body.email;
    if (req.body.phone === "" || req.body.phone === null) delete req.body.phone;
    if (req.body.gstin === "" || req.body.gstin === null) delete req.body.gstin;

    const { error } = customerUpdateSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.reduce((acc, curr) => {
            acc[curr.path[0]] = curr.message;
            return acc;
        }, {});

        return res.status(400).json({
            message: "Validation failed",
            status: false,
            dataFound: false,
            errors
        });
    }

    next();
};

// Bulk operations validation
export const validateBulkDelete = (req, res, next) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required().messages({
            "array.min": "At least one ID is required",
            "string.pattern.base": "Invalid ID format"
        })
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
            status: false,
            dataFound: false
        });
    }

    next();
};

export const validateBulkUpdate = (req, res, next) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required(),
        status: Joi.string().valid("Active", "Inactive").required()
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
            status: false,
            dataFound: false
        });
    }

    next();
};

// Brand validation schemas
const brandSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        "string.empty": "Brand name is required",
        "string.min": "Brand name must be at least 2 characters",
        "string.max": "Brand name cannot exceed 50 characters"
    }),
    slug: Joi.string().required(),
    status: Joi.string().valid("Active", "Inactive").default("Active"),
    image: Joi.string().allow("").optional()
});

const brandUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    slug: Joi.string().optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    image: Joi.string().allow("").optional()
});

export const validateBrand = (req, res, next) => {
    const { error } = brandSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: false,
            errors: error.details.reduce((acc, curr) => {
                acc[curr.path[0]] = curr.message;
                return acc;
            }, {})
        });
    }
    next();
};

export const validateBrandUpdate = (req, res, next) => {
    const { error } = brandUpdateSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: false,
            errors: error.details.reduce((acc, curr) => {
                acc[curr.path[0]] = curr.message;
                return acc;
            }, {})
        });
    }
    next();
};

// Unit validation schemas
const unitSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        "string.empty": "Unit name is required",
        "string.min": "Unit name must be at least 2 characters",
        "string.max": "Unit name cannot exceed 50 characters"
    }),
    shortName: Joi.string().required().messages({
        "string.empty": "Short name is required"
    }),
    status: Joi.string().valid("Active", "Inactive").default("Active")
});

const unitUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    shortName: Joi.string().optional(),
    status: Joi.string().valid("Active", "Inactive").optional()
});

export const validateUnit = (req, res, next) => {
    const { error } = unitSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: false,
            errors: error.details.reduce((acc, curr) => {
                acc[curr.path[0]] = curr.message;
                return acc;
            }, {})
        });
    }
    next();
};

export const validateUnitUpdate = (req, res, next) => {
    const { error } = unitUpdateSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: false,
            errors: error.details.reduce((acc, curr) => {
                acc[curr.path[0]] = curr.message;
                return acc;
            }, {})
        });
    }
    next();
};

// Warranty validation schemas
const warrantySchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        "string.empty": "Warranty name is required",
        "string.min": "Warranty name must be at least 2 characters",
        "string.max": "Warranty name cannot exceed 100 characters"
    }),
    duration: Joi.number().integer().min(1).required().messages({
        "number.base": "Duration must be a number",
        "number.min": "Duration must be at least 1",
        "any.required": "Duration is required"
    }),
    type: Joi.string().valid("Days", "Months", "Years").required().messages({
        "any.only": "Type must be one of: Days, Months, Years",
        "any.required": "Period type is required"
    }),
    description: Joi.string().allow("", null).optional(),
    status: Joi.string().valid("Active", "Inactive").default("Active")
});

const warrantyUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    duration: Joi.number().integer().min(1).optional(),
    type: Joi.string().valid("Days", "Months", "Years").optional(),
    description: Joi.string().allow("", null).optional(),
    status: Joi.string().valid("Active", "Inactive").optional()
});

export const validateWarranty = (req, res, next) => {
    const { error } = warrantySchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: false,
            errors: error.details.reduce((acc, curr) => {
                acc[curr.path[0]] = curr.message;
                return acc;
            }, {})
        });
    }
    next();
};

export const validateWarrantyUpdate = (req, res, next) => {
    const { error } = warrantyUpdateSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: false,
            errors: error.details.reduce((acc, curr) => {
                acc[curr.path[0]] = curr.message;
                return acc;
            }, {})
        });
    }
    next();
};
