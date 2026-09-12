import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import Unit from "../models/Unit.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helpers 
const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "").trim();

const toDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

const fmtList = (p) => ({
    id: p._id,
    sku: p.sku,
    product: p.product,
    itemCode: p.itemCode || "",
    productImage: p.images && p.images.length > 0 ? p.images[0].url : "",
    category: p.categoryId?.name || "",
    brand: p.brandId?.name || "",
    price: p.priceBeforeTax,
    priceBeforeTax: p.priceBeforeTax,
    priceAfterTax: p.priceAfterTax,
    taxRate: p.taxRate,
    taxType: p.taxType,
    unit: p.unitId?.name || "",
    quantity: (p.quantity || 0),
    quantityAlert: (p.quantityAlert || 10),
    status: p.status,
    manufacturedDate: toDate(p.manufacturedDate),
    expiryDate: toDate(p.expiryDate),
    createdAt: toDate(p.createdAt)
});

const fmtDetail = (p) => ({
    id: p._id,
    storeId: p.storeId,
    warehouseId: p.warehouseId,
    product: p.product,
    slug: p.slug,
    sku: p.sku,
    itemCode: p.itemCode,
    sellingType: p.sellingType,
    categoryId: p.categoryId,
    subCategoryId: p.subCategoryId,
    brandId: p.brandId,
    unitId: p.unitId,
    barcodeSymbology: p.barcodeSymbology,
    description: p.description,
    taxType: p.taxType,
    taxRate: p.taxRate,
    priceBeforeTax: p.priceBeforeTax,
    taxAmount: p.taxAmount,
    priceAfterTax: p.priceAfterTax,
    quantity: (p.quantity || 0),
    quantityAlert: (p.quantityAlert || 10),
    status: p.status,
    images: p.images || [],
    customFields: p.customFields || {},
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
});

//GET ALL PRODUCTS  GET /api/products 
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category, brand, sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) {
            const searchRegex = { $regex: search, $options: "i" };

            // Find IDs for related models matching the search string
            const [matchingCats, matchingBrands, matchingUnits] = await Promise.all([
                Category.find({ name: searchRegex }).select("_id"),
                Brand.find({ name: searchRegex }).select("_id"),
                Unit.find({ name: searchRegex }).select("_id")
            ]);

            query.$or = [
                { product: searchRegex },
                { sku: searchRegex },
                { itemCode: searchRegex },
                { categoryId: { $in: matchingCats.map(c => c._id) } },
                { brandId: { $in: matchingBrands.map(b => b._id) } },
                { unitId: { $in: matchingUnits.map(u => u._id) } }
            ];

            // If search is a valid number, also search in price
            const searchNum = parseFloat(search);
            if (!isNaN(searchNum)) {
                query.$or.push({ priceBeforeTax: searchNum });
            }
        }
        if (category) query.categoryId = category;
        if (brand) query.brandId = brand;

        if (req.query.expired === "true") {
            query.expiryDate = { $lt: new Date() };
        }

        if (req.query.lowStock === "true") {
            query.$expr = {
                $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", { $ifNull: ["$quantityAlert", 10] }] }
                ]
            };
            query.status = "Available";
        }
        
        if (req.query.outOfStock === "true") {
            query.quantity = { $lte: 0 };
        }

        const SORT_FIELDS = { product: 1, sku: 1, price: "priceBeforeTax", quantity: 1, createdAt: 1, status: 1 };
        const sortField = SORT_FIELDS[sortBy] ? (typeof SORT_FIELDS[sortBy] === "string" ? SORT_FIELDS[sortBy] : sortBy) : "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;

        // limit=0  → return all (for client-side pagination)
        if (parseInt(limit) === 0) {
            const products = await Product.find(query)
                .populate("categoryId", "name")
                .populate("brandId", "name")
                .populate("unitId", "name")
                .sort({ [sortField]: sortOrder });
            return res.status(200).json({
                message: "Data Retrieved Successfully",
                status: true,
                dataFound: products.length > 0,
                data: products.map(fmtList)
            });
        }

        const pg = parseInt(page);
        const lim = parseInt(limit);

        const [products, count] = await Promise.all([
            Product.find(query)
                .populate("categoryId", "name")
                .populate("brandId", "name")
                .populate("unitId", "name")
                .sort({ [sortField]: sortOrder })
                .skip((pg - 1) * lim)
                .limit(lim),
            Product.countDocuments(query)
        ]);

        const pages = Math.ceil(count / lim);

        res.status(200).json({
            message: "Data Retrieved Successfully",
            status: true,
            dataFound: count > 0,
            data: products.map(fmtList),
            pagination: { total: count, page: pg, limit: lim, pages, hasNext: pg < pages, hasPrev: pg > 1 }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET SINGLE PRODUCT  GET /api/products/:id 
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("categoryId", "name")
            .populate("subCategoryId", "name")
            .populate("brandId", "name")
            .populate("unitId", "name");

        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        res.status(200).json({ message: "Product Retrieved Successfully", status: true, data: fmtDetail(product) });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//  CREATE PRODUCT  POST /api/products 
export const createProduct = async (req, res) => {
    try {
        const {
            storeId, warehouseId, product, slug, sku, itemCode, sellingType,
            categoryId, subCategoryId, brandId, unitId, barcodeSymbology,
            description, taxType, taxRate, priceBeforeTax, taxAmount, priceAfterTax, quantity, status,
            manufacturedDate, expiryDate, customFields
        } = req.body;

        if (await Product.findOne({ sku: sku?.toUpperCase() }))
            return res.status(400).json({ message: "SKU already exists. Please use a unique SKU.", status: false });

        if (await Product.findOne({ slug: slug?.toLowerCase() }))
            return res.status(400).json({ message: "Product with this slug already exists.", status: false });

        const created = await Product.create({
            storeId: storeId || null,
            warehouseId: warehouseId || null,
            product,
            slug: slug.toLowerCase(),
            sku: sku.toUpperCase(),
            itemCode: itemCode || "",
            sellingType: sellingType || null,
            categoryId: categoryId || null,
            subCategoryId: subCategoryId || null,
            brandId: brandId || null,
            unitId: unitId || null,
            barcodeSymbology: barcodeSymbology || "CODE128",
            description: description || "",
            taxType: taxType || "Exclusive",
            taxRate: parseFloat(taxRate) || 0,
            priceBeforeTax: parseFloat(priceBeforeTax) || 0,
            taxAmount: parseFloat(taxAmount) || 0,
            priceAfterTax: parseFloat(priceAfterTax) || 0,
            quantity: parseInt(quantity) || 0,
            quantityAlert: parseInt(customFields?.quantityAlert || req.body.quantityAlert) || 10,
            status: status || "Available",
            manufacturedDate: manufacturedDate || null,
            expiryDate: expiryDate || null,
            customFields: customFields || {}
        });

        res.status(201).json({
            message: "Product Created Successfully",
            status: true,
            data: { id: created._id, sku: created.sku, product: created.product }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//  UPDATE PRODUCT  PUT /api/products/:id
export const updateProduct = async (req, res) => {
    try {
        const existing = await Product.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Product not found", status: false });

        const {
            storeId, warehouseId, product, slug, sku, itemCode, sellingType,
            categoryId, subCategoryId, brandId, unitId, barcodeSymbology,
            description, taxType, taxRate, priceBeforeTax, taxAmount, priceAfterTax, quantity, status,
            manufacturedDate, expiryDate, customFields
        } = req.body;

        // Duplicate checks (skip own record)
        if (sku && sku.toUpperCase() !== existing.sku) {
            if (await Product.findOne({ sku: sku.toUpperCase(), _id: { $ne: req.params.id } }))
                return res.status(400).json({ message: "SKU already exists.", status: false });
        }
        if (slug && slug.toLowerCase() !== existing.slug) {
            if (await Product.findOne({ slug: slug.toLowerCase(), _id: { $ne: req.params.id } }))
                return res.status(400).json({ message: "Slug already exists.", status: false });
        }

        if (storeId !== undefined) existing.storeId = storeId || null;
        if (warehouseId !== undefined) existing.warehouseId = warehouseId || null;
        if (product !== undefined) existing.product = product;
        if (slug !== undefined) existing.slug = slug.toLowerCase();
        if (sku !== undefined) existing.sku = sku.toUpperCase();
        if (itemCode !== undefined) existing.itemCode = itemCode;
        if (sellingType !== undefined) existing.sellingType = sellingType;
        if (categoryId !== undefined) existing.categoryId = categoryId || null;
        if (subCategoryId !== undefined) existing.subCategoryId = subCategoryId || null;
        if (brandId !== undefined) existing.brandId = brandId || null;
        if (unitId !== undefined) existing.unitId = unitId || null;
        if (barcodeSymbology !== undefined) existing.barcodeSymbology = barcodeSymbology;
        if (description !== undefined) existing.description = description;
        if (taxType !== undefined) existing.taxType = taxType;
        if (taxRate !== undefined) existing.taxRate = parseFloat(taxRate);
        if (priceBeforeTax !== undefined) existing.priceBeforeTax = parseFloat(priceBeforeTax);
        if (taxAmount !== undefined) existing.taxAmount = parseFloat(taxAmount);
        if (priceAfterTax !== undefined) existing.priceAfterTax = parseFloat(priceAfterTax);
        if (quantity !== undefined) existing.quantity = parseInt(quantity);
        if (req.body.quantityAlert !== undefined || customFields?.quantityAlert !== undefined) {
             existing.quantityAlert = parseInt(req.body.quantityAlert || customFields?.quantityAlert) || 10;
        }
        if (status !== undefined) existing.status = status;
        if (manufacturedDate !== undefined) existing.manufacturedDate = manufacturedDate;
        if (expiryDate !== undefined) existing.expiryDate = expiryDate;
        if (customFields !== undefined) {
            existing.customFields = customFields;
            existing.markModified("customFields");
        }

        const updated = await existing.save();

        res.status(200).json({
            message: "Product Updated Successfully",
            status: true,
            data: { id: updated._id, updatedAt: toDate(updated.updatedAt) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// DELETE PRODUCT  DELETE /api/products/:id 
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        // Remove stored images from disk
        const uploadsDir = path.join(__dirname, "../../uploads/products");
        (product.images || []).forEach(img => {
            try {
                const fp = path.join(uploadsDir, img.filename);
                if (fs.existsSync(fp)) fs.unlinkSync(fp);
            } catch (_) { }
        });

        const id = product._id;
        await product.deleteOne();
        res.status(200).json({ message: "Product Deleted Successfully", status: true, data: { id } });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// BULK DELETE  POST /api/products/bulk-delete 
export const bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0)
            return res.status(400).json({ message: "Please provide an array of IDs to delete", status: false });

        const uploadsDir = path.join(__dirname, "../../uploads/products");
        const products = await Product.find({ _id: { $in: ids } });
        products.forEach(p => {
            (p.images || []).forEach(img => {
                try {
                    const fp = path.join(uploadsDir, img.filename);
                    if (fs.existsSync(fp)) fs.unlinkSync(fp);
                } catch (_) { }
            });
        });

        const result = await Product.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            message: "Products Deleted Successfully",
            status: true,
            data: { requested: ids.length, deletedCount: result.deletedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//  BULK UPDATE  POST /api/products/bulk-update 
export const bulkUpdateProducts = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0)
            return res.status(400).json({ message: "Please provide an array of IDs to update", status: false });
        if (!status)
            return res.status(400).json({ message: "Please provide a status to update", status: false });

        const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { status } });
        res.status(200).json({
            message: "Products Updated Successfully",
            status: true,
            data: { requested: ids.length, updatedCount: result.modifiedCount, updatedStatus: status }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// TOGGLE STATUS  PATCH /api/products/:id/status 
export const toggleProductStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: "Status is required", status: false });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        product.status = status;
        const updated = await product.save();

        res.status(200).json({
            message: "Product Status Updated Successfully",
            status: true,
            data: { id: updated._id, status: updated.status, updatedAt: updated.updatedAt.toISOString() }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// UPLOAD IMAGE  POST /api/products/:id/images 
export const uploadProductImages = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            // clean up uploaded file
            if (req.file) {
                try { fs.unlinkSync(req.file.path); } catch (_) { }
            }
            return res.status(404).json({ message: "Product not found", status: false });
        }
        if (!req.file) return res.status(400).json({ message: "No image file provided", status: false });

        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/products/${req.file.filename}`;
        product.images.push({ url: imageUrl, filename: req.file.filename });
        await product.save();

        res.status(200).json({ message: "Image Uploaded Successfully", status: true });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET IMAGES  GET /api/products/:id/images 
export const getProductImages = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select("images");
        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        res.status(200).json({
            status: true,
            data: (product.images || []).map(img => ({ imgId: img._id, url: img.url }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// DELETE IMAGE  DELETE /api/products/:id/images/:imgId 
export const deleteProductImageById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        const idx = product.images.findIndex(img => img._id.toString() === req.params.imgId);
        if (idx === -1) return res.status(404).json({ message: "Image not found", status: false });

        const img = product.images[idx];
        try {
            const fp = path.join(__dirname, "../../uploads/products", img.filename);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch (_) { }

        product.images.splice(idx, 1);
        await product.save();

        res.status(200).json({ message: "Image Deleted Successfully", status: true });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET CUSTOM FIELDS  GET /api/products/:id/custom-fields 
export const getCustomFields = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select("customFields");
        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        res.status(200).json({ status: true, data: product.customFields || {} });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// SAVE CUSTOM FIELDS  POST /api/products/:id/custom-fields 
export const saveCustomFields = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found", status: false });

        product.customFields = { ...(product.customFields || {}), ...req.body };
        product.markModified("customFields");
        await product.save();

        res.status(200).json({ message: "Custom Fields Saved Successfully", status: true });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// CHECK SKU  GET /api/products/check-sku 
export const checkSku = async (req, res) => {
    try {
        const { sku, excludeId } = req.query;
        if (!sku) return res.status(400).json({ message: "SKU is required", status: false });

        const query = { sku: sku.toUpperCase() };
        if (excludeId) query._id = { $ne: excludeId };

        const exists = await Product.findOne(query).select("_id");
        res.status(200).json({ status: true, isUnique: !exists });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GENERATE SKU  GET /api/products/generate-sku 
export const generateSku = async (req, res) => {
    try {
        const lastProduct = await Product.findOne({ sku: /^PRD-/ }).sort({ sku: -1 });
        let newNum = 1;
        if (lastProduct && lastProduct.sku) {
            const parts = lastProduct.sku.split("-");
            if (parts.length > 1) {
                const lastNum = parseInt(parts[1]);
                if (!isNaN(lastNum)) newNum = lastNum + 1;
            }
        }
        const sku = `PRD-${String(newNum).padStart(6, "0")}`;
        res.status(200).json({ status: true, sku });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};



//  EXPORT  GET /api/products/export?format=xlsx|pdf&lowStock=true|outOfStock=true|expired=true
export const exportProducts = async (req, res) => {
    try {
        const { format, id } = req.query;

        // Build query — same logic as getProducts
        const query = id ? { _id: id } : {};

        if (req.query.expired === "true") {
            query.expiryDate = { $lt: new Date() };
        } else if (req.query.lowStock === "true") {
            query.$expr = {
                $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", { $ifNull: ["$quantityAlert", 10] }] }
                ]
            };
            query.status = "Available";
        } else if (req.query.outOfStock === "true") {
            query.quantity = { $lte: 0 };
        }

        const products = await Product.find(query)
            .populate("categoryId", "name")
            .populate("brandId", "name")
            .populate("unitId", "name")
            .sort({ createdAt: -1 });

        // Determine report title & file name
        const isExpired = req.query.expired === "true";
        const isLowStock = req.query.lowStock === "true";
        const isOutOfStock = req.query.outOfStock === "true";

        const title = isExpired ? "Expired Products"
            : isLowStock ? "Low Stock Products"
                : isOutOfStock ? "Out of Stock Products"
                    : "All Products";

        const fileName = isExpired ? "expired_products"
            : isLowStock ? "low_stock_products"
                : isOutOfStock ? "out_of_stock_products"
                    : "products";

        if (format === "xlsx") {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet(title);

            // Decide columns based on mode
            if (isExpired) {
                ws.columns = [
                    { header: "S.No", key: "sno", width: 7 },
                    { header: "SKU", key: "sku", width: 16 },
                    { header: "Product", key: "product", width: 35 },
                    { header: "Category", key: "category", width: 22 },
                    { header: "Qty", key: "quantity", width: 10 },
                    { header: "Manufactured Date", key: "manufacturedDate", width: 18 },
                    { header: "Expiry Date", key: "expiryDate", width: 16 },
                    { header: "Status", key: "status", width: 14 },
                ];
                products.forEach((p, i) => {
                    ws.addRow({
                        sno: i + 1,
                        sku: p.sku,
                        product: p.product,
                        category: p.categoryId?.name || "-",
                        quantity: p.quantity,
                        manufacturedDate: p.manufacturedDate ? new Date(p.manufacturedDate).toLocaleDateString() : "-",
                        expiryDate: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "-",
                        status: p.status,
                    });
                });
            } else if (isLowStock || isOutOfStock) {
                ws.columns = [
                    { header: "S.No", key: "sno", width: 7 },
                    { header: "SKU", key: "sku", width: 16 },
                    { header: "Product", key: "product", width: 35 },
                    { header: "Category", key: "category", width: 22 },
                    ...(isLowStock ? [{ header: "Qty", key: "quantity", width: 10 }] : []),
                    { header: "Status", key: "status", width: 14 },
                ];
                products.forEach((p, i) => {
                    const isOut = (p.quantity || 0) <= 0;
                    const stockStatus = isOut ? "Out of Stock" : "Low Stock";
                    const row = { sno: i + 1, sku: p.sku, product: p.product, category: p.categoryId?.name || "-", status: stockStatus };
                    if (isLowStock) row.quantity = p.quantity;
                    ws.addRow(row);
                });
            } else {
                ws.columns = [
                    { header: "S.No", key: "sno", width: 7 },
                    { header: "SKU", key: "sku", width: 16 },
                    { header: "Product", key: "product", width: 35 },
                    { header: "Category", key: "category", width: 22 },
                    { header: "Brand", key: "brand", width: 20 },
                    { header: "Unit", key: "unit", width: 12 },
                    { header: "Price (Before Tax)", key: "priceBeforeTax", width: 20 },
                    { header: "Tax Rate (%)", key: "taxRate", width: 14 },
                    { header: "Price (After Tax)", key: "priceAfterTax", width: 22 },
                    { header: "Created At", key: "createdAt", width: 16 }
                ];
                products.forEach((p, i) => {
                    ws.addRow({
                        sno: i + 1, sku: p.sku, product: p.product,
                        category: p.categoryId?.name || "-", brand: p.brandId?.name || "-",
                        unit: p.unitId?.name || "-", priceBeforeTax: p.priceBeforeTax,
                        taxRate: p.taxRate, priceAfterTax: p.priceAfterTax,
                        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"
                    });
                });
            }

            ws.getRow(1).font = { bold: true };
            ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename=${fileName}.xlsx`);
            await wb.xlsx.write(res);
            res.end();

        } else if (format === "pdf") {
            const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=${fileName}.pdf`);
            doc.pipe(res);

            doc.fontSize(18).text(title, { align: "center" });
            doc.moveDown(0.5);

            if (isExpired) {
                // Expired: SKU | Product | Category | Qty | Manufactured | Expiry
                const col = { sno: 20, sku: 50, product: 120, category: 290, qty: 400, mfg: 445, exp: 545 };
                const rowH = 28;
                let y = doc.y + 10;

                const drawHdr = (yp) => {
                    doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
                    doc.text("S.No", col.sno, yp); doc.text("SKU", col.sku, yp);
                    doc.text("Product", col.product, yp); doc.text("Category", col.category, yp);
                    doc.text("Qty", col.qty, yp); doc.text("Mfg Date", col.mfg, yp);
                    doc.text("Exp Date", col.exp, yp);
                    doc.moveTo(20, yp + 12).lineTo(790, yp + 12).strokeColor("#cccccc").stroke();
                    doc.font("Helvetica").strokeColor("black");
                };
                drawHdr(y); y += 18;
                products.forEach((p, i) => {
                    if (y + rowH > 555) { doc.addPage({ layout: "landscape" }); y = 50; drawHdr(y); y += 18; }
                    doc.fontSize(9).fillColor("black");
                    doc.text(`${i + 1}`, col.sno, y);
                    doc.text(p.sku || "-", col.sku, y, { width: 65, ellipsis: true });
                    doc.text(p.product || "-", col.product, y, { width: 160, ellipsis: true });
                    doc.text(p.categoryId?.name || "-", col.category, y, { width: 100 });
                    doc.text(`${p.quantity}`, col.qty, y, { width: 40 });
                    doc.text(p.manufacturedDate ? new Date(p.manufacturedDate).toLocaleDateString() : "-", col.mfg, y, { width: 90 });
                    doc.text(p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "-", col.exp, y, { width: 90 });
                    y += rowH;
                    doc.moveTo(20, y - 8).lineTo(790, y - 8).strokeColor("#eeeeee").stroke().strokeColor("black");
                });

            } else if (isLowStock || isOutOfStock) {
                // Low/Out Stock: SKU | Product | Category | (Qty if lowStock) | Status
                const col = isLowStock
                    ? { sno: 20, sku: 55, product: 140, category: 360, qty: 480, status: 555 }
                    : { sno: 20, sku: 55, product: 140, category: 360, status: 510 };
                const rowH = 28;
                let y = doc.y + 10;

                const drawHdr = (yp) => {
                    doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
                    doc.text("S.No", col.sno, yp); doc.text("SKU", col.sku, yp);
                    doc.text("Product", col.product, yp); doc.text("Category", col.category, yp);
                    if (isLowStock) doc.text("Qty", col.qty, yp);
                    doc.text("Status", col.status, yp);
                    doc.moveTo(20, yp + 12).lineTo(790, yp + 12).strokeColor("#cccccc").stroke();
                    doc.font("Helvetica").strokeColor("black");
                };
                drawHdr(y); y += 18;
                products.forEach((p, i) => {
                    if (y + rowH > 555) { doc.addPage({ layout: "landscape" }); y = 50; drawHdr(y); y += 18; }
                    doc.fontSize(9).fillColor("black");
                    doc.text(`${i + 1}`, col.sno, y);
                    doc.text(p.sku || "-", col.sku, y, { width: 80, ellipsis: true });
                    doc.text(p.product || "-", col.product, y, { width: 210, ellipsis: true });
                    doc.text(p.categoryId?.name || "-", col.category, y, { width: 110 });
                    if (isLowStock) doc.text(`${p.quantity}`, col.qty, y, { width: 60 });
                    const isOut = (p.quantity || 0) <= 0;
                    const stockStatus = isOut ? "Out of Stock" : "Low Stock";
                    doc.text(stockStatus, col.status, y, { width: 100 });
                    y += rowH;
                    doc.moveTo(20, y - 8).lineTo(790, y - 8).strokeColor("#eeeeee").stroke().strokeColor("black");
                });

            } else if (id && products.length === 1) {
                const p = products[0];
                doc.fontSize(20).text("Product Details", { align: "center", underline: true });
                doc.moveDown(1.5);
                const writeRow = (label, value) => {
                    doc.fontSize(12).font("Helvetica-Bold").text(`${label}: `, { continued: true })
                        .font("Helvetica").text(value || "N/A");
                    doc.moveDown(0.5);
                };
                writeRow("Product Name", p.product); writeRow("SKU", p.sku);
                writeRow("Item Code", p.itemCode); writeRow("Category", p.categoryId?.name);
                writeRow("Brand", p.brandId?.name); writeRow("Unit", p.unitId?.name);
                writeRow("Quantity", p.quantity?.toString());
                writeRow("Price (Before Tax)", `₹${p.priceBeforeTax}`);
                writeRow("Tax Rate (%)", p.taxRate?.toString());
                writeRow("Price (After Tax)", `₹${p.priceAfterTax}`);
                writeRow("Status", p.status);
            } else {
                const col = { sno: 20, sku: 65, product: 180, category: 380, brand: 500, price: 620 };
                const rowH = 28;
                let y = doc.y + 10;
                const drawHdr = (yp) => {
                    doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
                    doc.text("S.No", col.sno, yp); doc.text("SKU", col.sku, yp);
                    doc.text("Product", col.product, yp); doc.text("Category", col.category, yp);
                    doc.text("Brand", col.brand, yp); doc.text("Price(₹)", col.price, yp);
                    doc.moveTo(20, yp + 12).lineTo(790, yp + 12).strokeColor("#cccccc").stroke();
                    doc.font("Helvetica").strokeColor("black");
                };
                drawHdr(y); y += 18;
                products.forEach((p, i) => {
                    if (y + rowH > 555) { doc.addPage({ layout: "landscape" }); y = 50; drawHdr(y); y += 18; }
                    doc.fontSize(9).fillColor("black");
                    doc.text(`${i + 1}`, col.sno, y);
                    doc.text(p.sku || "-", col.sku, y, { width: 100, ellipsis: true });
                    doc.text(p.product || "-", col.product, y, { width: 180, ellipsis: true });
                    doc.text(p.categoryId?.name || "-", col.category, y, { width: 100 });
                    doc.text(p.brandId?.name || "-", col.brand, y, { width: 100 });
                    doc.text(`${p.priceBeforeTax}`, col.price, y, { width: 80 });
                    y += rowH;
                    doc.moveTo(20, y - 8).lineTo(790, y - 8).strokeColor("#eeeeee").stroke().strokeColor("black");
                });
            }
            doc.end();
        } else {
            res.status(400).json({ message: "Invalid format. Use 'xlsx' or 'pdf'.", status: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message, status: false });
    }
};


// DOWNLOAD SAMPLE CSV  GET /api/products/import/sample 
export const downloadSampleCsv = async (req, res) => {
    try {
        const headers = [
            "product", "slug", "sku", "itemCode", "sellingType",
            "categoryId", "subCategoryId", "brandId", "unitId",
            "barcodeSymbology", "description", "taxType", "taxRate",
            "priceBeforeTax", "taxAmount", "priceAfterTax", "quantity", "status"
        ];
        const rows = [
            ["iPhone 14", "iphone-14", "PRD001", "ITEM001", "Transactional", "", "", "", "", "CODE128", "Latest Apple iPhone", "Exclusive", "18", "69999", "12599.82", "82598.82", "50", "Available"],
            ["Samsung S24", "samsung-s24", "PRD002", "ITEM002", "Transactional", "", "", "", "", "EAN13", "Samsung Galaxy S24 Ultra", "Exclusive", "18", "79999", "14399.82", "94398.82", "30", "Available"]
        ];

        let csv = headers.join(",") + "\n";
        rows.forEach(r => { csv += r.map(v => `"${v}"`).join(",") + "\n"; });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=products_sample.csv");
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// IMPORT PRODUCTS  POST /api/products/import 
export const importProducts = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No CSV file provided", status: false });

        const content = fs.readFileSync(req.file.path, "utf-8");
        const lines = content.split("\n").filter(l => l.trim());

        if (lines.length < 2) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "CSV file is empty or has no data rows", status: false });
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const dataRows = lines.slice(1);
        let importedCount = 0, failedCount = 0;
        const errors = [];

        for (let i = 0; i < dataRows.length; i++) {
            try {
                const vals = dataRows[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
                const row = {};
                headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });

                if (!row.product || !row.sku) {
                    failedCount++;
                    errors.push(`Row ${i + 2}: product and sku are required`);
                    continue;
                }

                const slug = row.slug || row.product.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

                if (await Product.findOne({ sku: row.sku.toUpperCase() }) || await Product.findOne({ slug })) {
                    failedCount++;
                    errors.push(`Row ${i + 2}: Duplicate SKU or slug`);
                    continue;
                }

                await Product.create({
                    product: row.product,
                    slug,
                    sku: row.sku.toUpperCase(),
                    itemCode: row.itemCode || "",
                    sellingType: row.sellingType || null,
                    categoryId: row.categoryId || null,
                    subCategoryId: row.subCategoryId || null,
                    brandId: row.brandId || null,
                    unitId: row.unitId || null,
                    barcodeSymbology: row.barcodeSymbology || "CODE128",
                    description: row.description || "",
                    taxType: row.taxType || "Exclusive",
                    taxRate: parseFloat(row.taxRate) || 0,
                    priceBeforeTax: parseFloat(row.priceBeforeTax) || 0,
                    taxAmount: parseFloat(row.taxAmount) || 0,
                    priceAfterTax: parseFloat(row.priceAfterTax) || 0,
                    quantity: parseInt(row.quantity) || 0,
                    status: row.status || "Available"
                });
                importedCount++;
            } catch (rowErr) {
                failedCount++;
                errors.push(`Row ${i + 2}: ${rowErr.message}`);
            }
        }

        try { fs.unlinkSync(req.file.path); } catch (_) { }

        res.status(200).json({
            message: "Products Imported Successfully",
            status: true,
            data: { totalRecords: dataRows.length, importedCount, failedCount },
            ...(errors.length && { errors })
        });
    } catch (error) {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) { } }
        res.status(500).json({ message: error.message, status: false });
    }
};
