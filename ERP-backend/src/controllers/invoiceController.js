import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Counter from "../models/Counter.js";
import BankAccount from "../models/BankAccount.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

/** Convert number to Indian words (e.g. 1120 → "One Thousand One Hundred Twenty Rupees Only") */
const numberToWords = (amount) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convert = (n) => {
        if (n === 0) return "";
        if (n < 20) return ones[n] + " ";
        if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + convert(n % 100);
        if (n < 100000) return convert(Math.floor(n / 1000)) + "Thousand " + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + "Lakh " + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + "Crore " + convert(n % 10000000);
    };

    const num = Math.round(amount);
    if (num === 0) return "Zero Rupees Only";
    return convert(num).trim() + " Rupees Only";
};

/** Helper to compute totals */
const computeTotals = (items) => {
    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = items.map(item => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.rate) || 0;
        const discount = Number(item.discount) || 0;
        const taxPercent = Number(item.taxPercent) || 0;

        const baseAmount = qty * rate;
        const amountAfterDiscount = baseAmount - discount;
        const itemTax = (amountAfterDiscount * taxPercent) / 100;
        const itemTotal = amountAfterDiscount + itemTax;

        subtotal += amountAfterDiscount;
        taxAmount += itemTax;

        return {
            ...item,
            amount: +itemTotal.toFixed(2)
        };
    });

    const grandTotal = subtotal + taxAmount;
    return {
        items: computedItems,
        subtotal: +subtotal.toFixed(2),
        taxAmount: +taxAmount.toFixed(2),
        grandTotal: +grandTotal.toFixed(2)
    };
};

// 1. GET /api/invoices
export const getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, customerId, sortBy, type } = req.query;
        const query = {};

        if (type) {
            if (type === "Invoice") {
                query.$or = [{ type: "Invoice" }, { type: { $exists: false } }];
            } else {
                query.type = type;
            }
        }
        if (status) query.paymentStatus = status;
        if (customerId) query.customerId = customerId;
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" } },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$grandTotal" },
                            regex: search,
                            options: "i"
                        }
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $dateToString: { format: "%Y-%m-%d", date: "$dueDate" } },
                            regex: search,
                            options: "i"
                        }
                    }
                }
            ];
        }

        if (sortBy === 'lastMonth') {
            const date = new Date();
            date.setMonth(date.getMonth() - 1);
            query.invoiceDate = { $gte: date };
        } else if (sortBy === 'last7') {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            query.invoiceDate = { $gte: date };
        }

        let sortOptions = { createdAt: -1 };
        if (sortBy === 'asc') sortOptions = { invoiceDate: 1 };
        else if (sortBy === 'desc') sortOptions = { invoiceDate: -1 };

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .populate("customerId", "firstName lastName")
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        const formattedData = invoices.map(inv => ({
            invoiceId: inv._id,
            invoiceNumber: inv.invoiceNumber,
            saleNumber: inv.saleNumber || inv.invoiceNumber,
            customerName: inv.customerName || (inv.customerId ? `${inv.customerId.firstName} ${inv.customerId.lastName}`.trim() : "Walk-in Customer"),
            invoiceDate: inv.invoiceDate.toISOString().split('T')[0],
            dueDate: inv.dueDate.toISOString().split('T')[0],
            grandTotal: inv.grandTotal,
            paidAmount: inv.paidAmount || 0,
            amountDue: inv.amountDue,
            paymentStatus: inv.paymentStatus,
            invoiceType: inv.invoiceType
        }));

        return res.status(200).json({
            status: true,
            message: "Invoices fetched successfully",
            totalRecords: total,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 2. GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
    try {
        const inv = await Invoice.findById(req.params.id).populate("customerId");
        if (!inv) return res.status(404).json({ status: false, message: "Invoice not found" });

        const data = {
            invoiceId: inv._id,
            invoiceNumber: inv.invoiceNumber,
            saleNumber: inv.saleNumber || inv.invoiceNumber,
            invoiceType: inv.invoiceType,
            customer: {
                customerId: inv.customerId?._id,
                name: inv.customerName || (inv.customerId ? `${inv.customerId.firstName} ${inv.customerId.lastName}`.trim() : "N/A"),
                email: inv.customerEmail || inv.customerId?.email || "",
                phone: inv.customerPhone || inv.customerId?.phone || "",
                address: inv.customerAddress || inv.customerId?.address || "",
                gstin: inv.customerGstin || inv.customerId?.gstin || ""
            },
            customerAddress: inv.customerAddress || (inv.customerId ? `${inv.customerId.address || ""}\n${inv.customerId.city || ""} ${inv.customerId.state || ""} ${inv.customerId.postalCode || ""}`.trim() : ""),
            customerGstin: inv.customerGstin || inv.customerId?.gstin || "",
            invoiceDate: inv.invoiceDate.toISOString().split('T')[0],
            dueDate: inv.dueDate.toISOString().split('T')[0],
            paymentStatus: inv.paymentStatus,
            items: inv.items.map((item, index) => ({
                itemId: index + 1,
                productName: item.productName,
                quantity: item.quantity,
                rate: item.rate,
                discount: item.discount,
                taxPercent: item.taxPercent,
                hsnSac: item.hsnSac,
                amount: item.amount
            })),
            subtotal: inv.subtotal,
            taxAmount: inv.taxAmount,
            grandTotal: inv.grandTotal,
            paidAmount: inv.paidAmount || 0,
            amountInWords: inv.amountInWords || "",
            notes: inv.notes,
            terms: inv.terms,
            createdAt: inv.createdAt
        };

        return res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 3. POST /api/invoices/add
export const createInvoice = async (req, res) => {
    try {
        const {
            type, invoiceType, customerId,
            customerName, customerEmail, customerPhone, customerAddress, customerGstin,
            invoiceDate, dueDate, paymentStatus, paidAmount, items, notes, terms
        } = req.body;

        const totals = computeTotals(items);

        // Auto-gen number if not provided
        const prefix = type === "Sale" ? "SALE" : "";
        const today = new Date();
        const monthName = today.toLocaleString('en-US', { month: 'long' });
        const year = today.getFullYear();
        const nextYear = year + 1;
        const suffix = type === "Sale" ? "" : `_${monthName}_${year}_${nextYear}`;

        // 1. Calculate the date-based Invoice Number (for Invoices only)
        let dateBasedInvoiceNumber = "";
        if (type !== "Sale") {
            const lastInv = await Invoice.findOne({ invoiceNumber: { $regex: `${suffix}$` } }).sort({ invoiceNumber: -1 });
            let iSeq = 1;
            if (lastInv) {
                const match = lastInv.invoiceNumber.match(/^(\d+)_/);
                if (match) iSeq = parseInt(match[1], 10) + 1;
            }
            dateBasedInvoiceNumber = `${String(iSeq).padStart(4, "0")}${suffix}`;
        }

        // 2. GLOBAL SALE NUMBER (SALE####) - Forever Sequential (Never reuses deleted numbers)
        const counterRecord = await Counter.findOneAndUpdate(
            { id: "saleNumber" },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        );
        const saleNumber = `SALE${String(counterRecord.seq).padStart(4, "0")}`;

        // 3. Final Assignments
        const finalInvoiceNumber = type === "Sale" ? saleNumber : dateBasedInvoiceNumber;

        const newInvoice = await Invoice.create({
            type: type || "Invoice",
            invoiceNumber: finalInvoiceNumber,
            saleNumber: saleNumber,
            invoiceType: invoiceType || (type === "Sale" ? "Standard" : "Intrastate"),
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            customerGstin,
            invoiceDate: invoiceDate || today,
            dueDate,
            paymentStatus: paymentStatus || "Unpaid",
            paidAmount: Number(paidAmount) || 0,
            items: totals.items,
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            notes,
            terms
        });

        // --- UPDATE STOCK ---
        if (newInvoice.items && newInvoice.items.length > 0) {
            for (const item of newInvoice.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        const newQty = (product.quantity || 0) - (item.quantity || 0);
                        product.quantity = Math.max(0, newQty);
                        
                        // Update status if stock is empty
                        if (product.quantity <= 0) {
                            product.status = "Out of Stock";
                        }
                        await product.save();
                    }
                }
            }
        }

        return res.status(201).json({
            status: true,
            message: "Invoice created successfully",
            invoiceId: newInvoice._id,
            invoiceNumber: newInvoice.invoiceNumber
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 4. PUT /api/invoices/update/:id
// 4. PUT /api/invoices/update/:id
export const updateInvoice = async (req, res) => {
    try {
        const { items, ...rest } = req.body;
        let updateData = { ...rest };

        const inv = await Invoice.findById(req.params.id);
        if (!inv) return res.status(404).json({ status: false, message: "Invoice not found" });

        // --- 1. RESTORE OLD STOCK ---
        if (inv.items && inv.items.length > 0) {
            for (const item of inv.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity = (product.quantity || 0) + (item.quantity || 0);
                        if (product.quantity > 0 && product.status === "Out of Stock") {
                            product.status = "Available";
                        }
                        await product.save();
                    }
                }
            }
        }

        // --- 2. UPDATE INVOICE ---
        if (items) {
            const totals = computeTotals(items);
            updateData.items = totals.items;
            updateData.subtotal = totals.subtotal;
            updateData.taxAmount = totals.taxAmount;
            updateData.grandTotal = totals.grandTotal;
        }

        const updated = await Invoice.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ status: false, message: "Invoice not found" });

        // --- 3. APPLY NEW STOCK DECREMENT ---
        if (updated.items && updated.items.length > 0) {
            for (const item of updated.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        const newQty = (product.quantity || 0) - (item.quantity || 0);
                        product.quantity = Math.max(0, newQty);
                        if (product.quantity <= 0) {
                            product.status = "Out of Stock";
                        }
                        await product.save();
                    }
                }
            }
        }

        return res.status(200).json({
            status: true,
            message: "Invoice updated successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 5. DELETE /api/invoices/delete/:id
export const deleteInvoice = async (req, res) => {
    try {
        const inv = await Invoice.findById(req.params.id);
        if (!inv) return res.status(404).json({ status: false, message: "Invoice not found" });

        // --- RESTORE STOCK ---
        if (inv.items && inv.items.length > 0) {
            for (const item of inv.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity = (product.quantity || 0) + (item.quantity || 0);
                        if (product.quantity > 0 && product.status === "Out of Stock") {
                            product.status = "Available";
                        }
                        await product.save();
                    }
                }
            }
        }

        await Invoice.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            status: true,
            message: "Invoice deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 6. GET /api/invoices/generate-number
export const generateInvoiceNumber = async (req, res) => {
    try {
        const { type = "Invoice" } = req.query;
        const prefix = type === "Sale" ? "SALE" : "";
        const today = new Date();
        const monthName = today.toLocaleString('en-US', { month: 'long' });
        const year = today.getFullYear();
        const nextYear = year + 1;
        const suffix = `_${monthName}_${year}_${nextYear}`;
        // Get the global SALE#### sequence (Forever Sequential)
        // Here we do NOT increment it because this is just a preview/generator call
        const counterRecord = await Counter.findOne({ id: "saleNumber" });
        const currentSeq = counterRecord ? counterRecord.seq : 0;
        const saleNumber = `SALE${String(currentSeq + 1).padStart(4, "0")}`;

        let invoiceNumberResult;
        if (type === "Sale") {
            invoiceNumberResult = saleNumber;
        } else {
            // For Invoices, keep the separate date-based counter for the invoiceNumber itself
            const lastInv = await Invoice.findOne({ invoiceNumber: { $regex: `${suffix}$` } }).sort({ invoiceNumber: -1 });
            let iSeq = 1;
            if (lastInv) {
                const match = lastInv.invoiceNumber.match(/^(\d+)_/);
                if (match) iSeq = parseInt(match[1], 10) + 1;
            }
            invoiceNumberResult = `${String(iSeq).padStart(4, "0")}${suffix}`;
        }

        return res.status(200).json({
            status: true,
            invoiceNumber: invoiceNumberResult
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Update Status Utility
export const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Invoice.findByIdAndUpdate(req.params.id, { paymentStatus: status }, { new: true });
        if (!updated) return res.status(404).json({ status: false, message: "Invoice not found" });

        return res.status(200).json({
            status: true,
            message: "Status updated successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Bulk Delete
export const bulkDeleteInvoices = async (req, res) => {
    try {
        const { invoiceIds } = req.body;
        const invoices = await Invoice.find({ _id: { $in: invoiceIds } });

        // --- RESTORE STOCK ---
        for (const inv of invoices) {
            if (inv.items && inv.items.length > 0) {
                for (const item of inv.items) {
                    if (item.productId) {
                        const product = await Product.findById(item.productId);
                        if (product) {
                            product.quantity = (product.quantity || 0) + (item.quantity || 0);
                            if (product.quantity > 0 && product.status === "Out of Stock") {
                                product.status = "Available";
                            }
                            await product.save();
                        }
                    }
                }
            }
        }

        await Invoice.deleteMany({ _id: { $in: invoiceIds } });
        return res.status(200).json({
            status: true,
            message: "Selected invoices deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Bulk Update
export const bulkUpdateInvoices = async (req, res) => {
    try {
        const { invoiceIds, status } = req.body;
        await Invoice.updateMany({ _id: { $in: invoiceIds } }, { paymentStatus: status });
        return res.status(200).json({
            status: true,
            message: "Statuses updated successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Export Bulk PDF - OPTIMIZED with pagination support
export const exportInvoicesPdf = async (req, res) => {
    try {
        // ✅ Support optional pagination: ?limit=100&page=1
        const limit = Math.min(Number(req.query.limit) || 500, 1000); // Max 1000 per request
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        // ✅ Use .lean() for faster queries + field projection
        const invoices = await Invoice.find()
            .select("invoiceNumber customerName customerId invoiceDate invoiceType paymentStatus grandTotal")
            .lean() // Skip Mongoose overhead
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // ✅ Batch fetch customer names if needed (only if customerId exists and name not provided)
        const customerIds = invoices
            .filter(inv => inv.customerId && !inv.customerName)
            .map(inv => inv.customerId);
        
        let customerMap = {};
        if (customerIds.length > 0) {
            const customers = await Customer.find({ _id: { $in: customerIds } })
                .select("_id firstName lastName")
                .lean();
            customerMap = customers.reduce((acc, c) => {
                acc[c._id.toString()] = `${c.firstName} ${c.lastName}`.trim();
                return acc;
            }, {});
        }

        // ✅ Set headers BEFORE PDF generation - enables streaming
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoices-${Date.now()}.pdf`);

        const doc = new PDFDocument({ margin: 40 });
        doc.pipe(res);

        // Title
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#ff9f43').text("Invoice Report", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666666').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" });
        doc.moveDown(2);

        // Colors
        const tableColor = '#1a202c';
        const headerColor = '#f8f9fa';
        const borderColor = '#e2e8f0';

        // Table settings
        const tableTop = doc.y;
        const defaultFontSize = 10;

        const col1 = 40;   // Invoice No
        const col2 = 140;  // Customer
        const col3 = 300;  // Date
        const col4 = 390;  // Status
        const col5 = 480;  // Total

        // Header Background
        doc.rect(40, tableTop - 5, 520, 25).fill(headerColor);

        // Header Text
        doc.font("Helvetica-Bold").fontSize(defaultFontSize).fillColor(tableColor);
        doc.text("Invoice No", col1, tableTop + 2);
        doc.text("Customer", col2, tableTop + 2);
        doc.text("Date", col3, tableTop + 2);
        doc.text("Status", col4, tableTop + 2);
        doc.text("Grand Total", col5, tableTop + 2, { width: 80, align: "right" });

        // Header Bottom Border
        doc.moveTo(40, tableTop + 20).lineTo(560, tableTop + 20).lineWidth(1).strokeColor(borderColor).stroke();

        let y = tableTop + 30;
        doc.font("Helvetica").fontSize(defaultFontSize);

        invoices.forEach((inv, i) => {
            // Check page overflow
            if (y > doc.page.height - 80) {
                doc.addPage();
                y = 50;

                // Redraw Header
                doc.rect(40, y - 5, 520, 25).fill(headerColor);
                doc.font("Helvetica-Bold").fillColor(tableColor);
                doc.text("Invoice No", col1, y + 2);
                doc.text("Customer", col2, y + 2);
                doc.text("Date", col3, y + 2);
                doc.text("Status", col4, y + 2);
                doc.text("Grand Total", col5, y + 2, { width: 80, align: "right" });
                doc.moveTo(40, y + 20).lineTo(560, y + 20).lineWidth(1).strokeColor(borderColor).stroke();
                y += 30;
                doc.font("Helvetica").fillColor(tableColor);
            }

            // ✅ Use customerMap for already-fetched names, fallback to stored name
            const customerName = inv.customerName || customerMap[inv.customerId?.toString()] || "Walk-in";
            const amtStr = `${inv.invoiceType === 'International' ? '$' : 'Rs.'}${Number(inv.grandTotal).toFixed(2)}`;

            doc.fillColor(tableColor);
            doc.text(inv.invoiceNumber, col1, y);
            doc.text(customerName.substring(0, 25), col2, y);
            doc.text(inv.invoiceDate.toISOString().split('T')[0], col3, y);

            // Status with color
            let statusColor = '#3b82f6'; // primary
            if (inv.paymentStatus === 'Paid') statusColor = '#22c55e'; // green
            else if (inv.paymentStatus === 'Unpaid') statusColor = '#ef4444'; // red
            else if (inv.paymentStatus === 'Overdue') statusColor = '#f59e0b'; // orange

            doc.fillColor(statusColor).text(inv.paymentStatus, col4, y);
            doc.fillColor(tableColor).text(amtStr, col5, y, { width: 80, align: "right" });

            y += 20;
            // Row bottom line
            doc.moveTo(40, y - 5).lineTo(560, y - 5).lineWidth(0.5).strokeColor(borderColor).stroke();
            y += 5;
        });

        // Summary box
        doc.moveDown(2);
        y = doc.y;
        if (y > doc.page.height - 120) {
            doc.addPage();
            y = 50;
        }

        const totalInvoices = invoices.length;
        const totalValue = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);

        doc.rect(380, y, 180, 60).fillColor('#f8f9fa').fill();
        doc.rect(380, y, 180, 60).strokeColor(borderColor).stroke();

        doc.font("Helvetica-Bold").fontSize(11).fillColor(tableColor);
        doc.text("Summary", 395, y + 10);
        doc.font("Helvetica").fontSize(10);
        doc.text(`Total Invoices: ${totalInvoices}`, 395, y + 28);
        doc.text(`Total Value: ${totalValue.toFixed(2)}`, 395, y + 42);

        doc.end(); // ✅ Flushes pipe to response
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ status: false, message: error.message });
        }
    }
};

// Export Bulk Excel - OPTIMIZED with pagination
export const exportInvoicesXlsx = async (req, res) => {
    try {
        // ✅ Support optional pagination: ?limit=500&page=1
        const limit = Math.min(Number(req.query.limit) || 500, 2000); // Max 2000 per request
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        // ✅ Use .lean() for faster queries + field projection
        const invoices = await Invoice.find()
            .select("invoiceNumber customerName customerId invoiceDate grandTotal paymentStatus")
            .lean()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // ✅ Batch fetch customer names if needed
        const customerIds = invoices
            .filter(inv => inv.customerId && !inv.customerName)
            .map(inv => inv.customerId);
        
        let customerMap = {};
        if (customerIds.length > 0) {
            const customers = await Customer.find({ _id: { $in: customerIds } })
                .select("_id firstName lastName")
                .lean();
            customerMap = customers.reduce((acc, c) => {
                acc[c._id.toString()] = `${c.firstName} ${c.lastName}`.trim();
                return acc;
            }, {});
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Invoices");

        sheet.columns = [
            { header: "Invoice No", key: "invoiceNumber", width: 20 },
            { header: "Customer", key: "customer", width: 30 },
            { header: "Date", key: "date", width: 15 },
            { header: "Grand Total", key: "total", width: 15 },
            { header: "Status", key: "status", width: 15 }
        ];

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

        invoices.forEach(inv => {
            const customerName = inv.customerName || customerMap[inv.customerId?.toString()] || "Walk-in";
            sheet.addRow({
                invoiceNumber: inv.invoiceNumber,
                customer: customerName,
                date: inv.invoiceDate.toISOString().split('T')[0],
                total: inv.grandTotal,
                status: inv.paymentStatus
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=invoices-${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ status: false, message: error.message });
        }
    }
};

// Single Invoice Report (PDF Download) - OPTIMIZED
export const exportSingleInvoicePdf = async (req, res) => {
    try {
        const inv = await Invoice.findById(req.params.id)
            .populate("customerId")
            .lean();
        if (!inv) return res.status(404).json({ status: false, message: "Invoice not found" });

        const bankAccount = await BankAccount.findOne({ isDefault: true }).lean().catch(() => null);
        const customer = inv.customerId;

        // Set headers for streaming
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice_${inv.invoiceNumber}.pdf`);

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        doc.pipe(res);

        const margin = 40;
        const pageWidth = 595.28;
        const width = pageWidth - (margin * 2); 
        const endX = pageWidth - margin;
        
        // --- TITLE ---
        doc.font("Helvetica-Bold").fontSize(12).text("Tax Invoice", margin, 40, { align: "center", width: width });

        // --- HEADER GRID BOX ---
        let currentY = 60;
        const headerHeight = 220;
        doc.rect(margin, currentY, width, headerHeight).lineWidth(0.8).strokeColor("#000").stroke();
        
        // Vertical split at the middle
        const midX = margin + (width / 2);
        doc.moveTo(midX, currentY).lineTo(midX, currentY + headerHeight).stroke();

        // Left Side Content
        doc.fontSize(9).font("Helvetica-Bold").text("Invoice From:", margin + 5, currentY + 5);
        doc.fontSize(10).text("WEBERFOX TECHNOLOGIES PVT LTD", margin + 5, currentY + 20);
        doc.font("Helvetica").fontSize(8).text(
            "Building No:15/538, Koduvazhathu, Koivila P.O, Thevalakkara,\nKarunagappally, Kollam, Kerala, INDIA. PIN: 691590\nGSTIN/UIN: 32AADCW0489R1ZQ\nState Name: Kerala, code:32\nE-Mail: contact@weberfox.com\nContact number: +91 94962 69666",
            margin + 5, currentY + 35, { width: (width/2) - 10, lineGap: 2 }
        );

        // Horizontal line for Buyer section
        const buyerY = currentY + 110;
        doc.moveTo(margin, buyerY).lineTo(midX, buyerY).stroke();
        doc.fontSize(9).font("Helvetica-Bold").text("Buyer (Bill to):", margin + 5, buyerY + 5);
        
        const custName = customer ? `${customer.firstName} ${customer.lastName || ""}`.trim() : (inv.customerName || "-");
        doc.fontSize(10).text(custName.toUpperCase(), margin + 5, buyerY + 20);
        const custAddr = customer?.address || inv.customerAddress || "";
        doc.font("Helvetica").fontSize(8).text(custAddr, margin + 5, buyerY + 35, { width: (width/2) - 10 });
        if (inv.customerGstin) {
            doc.font("Helvetica-Bold").text(`GSTIN/UIN: ${inv.customerGstin}`, margin + 5, doc.y + 5);
        }

        // Right Side Content (Logo and Grid)
        try {
            const logoPath = "d:/ERP/react/template/src/assets/img/logo.png";
            doc.image(logoPath, midX + 40, currentY + 10, { width: 150 });
        } catch(e) {
            doc.fontSize(22).font("Helvetica-Bold").fillColor("#fe9f43").text("WeberFox", midX + 50, currentY + 15);
        }
        doc.fillColor("#000").fontSize(7).font("Helvetica").text("AHEAD BY A WAVELENGTH", midX, currentY + 55, { align: "center", width: width/2 });

        // Right side sub-grid
        const gridRow1 = currentY + 70;
        const gridRow2 = currentY + 115;
        const gridRow3 = currentY + 160;
        
        doc.moveTo(midX, gridRow1).lineTo(endX, gridRow1).stroke();
        doc.moveTo(midX, gridRow2).lineTo(endX, gridRow2).stroke();
        doc.moveTo(midX, gridRow3).lineTo(endX, gridRow3).stroke();

        // Invoice No / Date vertical split
        const invSplitX = midX + (width/4);
        doc.moveTo(invSplitX, gridRow1).lineTo(invSplitX, gridRow3).stroke();

        doc.fontSize(8).font("Helvetica").text("Invoice No.", midX + 5, gridRow1 + 5);
        doc.fontSize(9).font("Helvetica-Bold").text(inv.invoiceNumber, midX + 5, gridRow1 + 20);

        doc.fontSize(8).font("Helvetica").text("Dated", invSplitX + 5, gridRow1 + 5);
        doc.fontSize(9).font("Helvetica-Bold").text(new Date(inv.invoiceDate).toLocaleDateString("en-GB"), invSplitX + 5, gridRow1 + 20);

        doc.fontSize(8).font("Helvetica").text("Quote Ref. No.", midX + 5, gridRow2 + 5);
        const quoteNo = inv.notes?.match(/Quotation: ([^\s\(]+)/)?.[1] || "-";
        doc.fontSize(9).font("Helvetica-Bold").text(quoteNo, midX + 5, gridRow2 + 20);

        doc.fontSize(8).font("Helvetica").text("Dated", invSplitX + 5, gridRow2 + 5);
        const qDate = inv.notes?.match(/\(Dated: (.*?)\)/)?.[1] || "-";
        doc.fontSize(9).font("Helvetica-Bold").text(qDate, invSplitX + 5, gridRow2 + 20);

        doc.fontSize(8).font("Helvetica").text("Place of Supply :", midX + 5, gridRow3 + 5);
        doc.fontSize(9).font("Helvetica-Bold").text((inv.placeOfSupply || "KOLLAM").toUpperCase(), midX + 5, gridRow3 + 20);

        currentY += headerHeight + 5;

        // --- ITEMS TABLE ---
        const x = {
            sno: margin,           // 40
            item: margin + 25,     // 65
            hsn: margin + 125,    // 165
            qty: margin + 175,    // 215
            rate: margin + 205,   // 245
            amt: margin + 275,    // 315
            igst: margin + 345,   // 385
            total: margin + 430   // 470
        }

        const tableTop = currentY;
        const th = 45; // Table Header height
        doc.rect(margin, tableTop, width, th).stroke();
        [x.item, x.hsn, x.qty, x.rate, x.amt, x.igst, x.total].forEach(posX => {
            doc.moveTo(posX, tableTop).lineTo(posX, tableTop + th).stroke();
        });
        // IGST split
        doc.moveTo(x.igst, tableTop + 22).lineTo(x.total, tableTop + 22).stroke();
        doc.moveTo(x.igst + 30, tableTop + 22).lineTo(x.igst + 30, tableTop + th).stroke();

        doc.fontSize(8).font("Helvetica-Bold");
        doc.text("Sl. No.", x.sno, tableTop + 18, { width: 25, align: "center" });
        doc.text("Item & Description", x.item, tableTop + 18, { width: 100, align: "center" });
        doc.text("HSN/\nSAC", x.hsn, tableTop + 15, { width: 50, align: "center" });
        doc.text("Qty.", x.qty, tableTop + 18, { width: 30, align: "center" });
        doc.text("Rate", x.rate, tableTop + 18, { width: 70, align: "center" });
        doc.text("Amt.", x.amt, tableTop + 18, { width: 70, align: "center" });
        doc.text("IGST", x.igst, tableTop + 5, { width: 85, align: "center" });
        doc.text("%", x.igst, tableTop + 28, { width: 25, align: "center" });
        doc.text("Amt.", x.igst + 25, tableTop + 28, { width: 60, align: "center" });
        doc.text("Total Amount\n(Inc. IGST)", x.total, tableTop + 15, { width: 85, align: "center" });

        let rowY = tableTop + th;
        doc.font("Helvetica").fontSize(8);
        const minRowH = 50; 

        inv.items.forEach((item, i) => {
            // Pre-calculate height
            const textOptions = { width: 95 };
            const itemH = Math.max(minRowH, doc.heightOfString(item.productName || "-", textOptions) + 20);
            
            // Check page break
            if (rowY + itemH > 780) {
                doc.addPage();
                rowY = 50;
            }

            doc.rect(margin, rowY, width, itemH).stroke();
            [x.item, x.hsn, x.qty, x.rate, x.amt, x.igst, x.igst + 25, x.total].forEach(posX => {
                doc.moveTo(posX, rowY).lineTo(posX, rowY + itemH).stroke();
            });

            doc.text(`${i + 1}`, x.sno, rowY + 10, { width: 25, align: "center" });
            doc.font("Helvetica-Bold").text(item.productName || "-", x.item + 3, rowY + 10, textOptions);
            doc.font("Helvetica").text(item.hsnSac || "-", x.hsn, rowY + 10, { width: 50, align: "center" });
            doc.text(`${item.quantity}`, x.qty, rowY + 10, { width: 30, align: "center" });
            doc.text(`${(item.rate || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.rate, rowY + 10, { width: 65, align: "right" });
            
            const itemBaseAmt = (item.quantity || 0) * (item.rate || 0);
            doc.text(`${itemBaseAmt.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.amt, rowY + 10, { width: 65, align: "right" });
            doc.text(`${item.taxPercent || 18}`, x.igst, rowY + 10, { width: 25, align: "center" });
            
            const itemTax = (itemBaseAmt * (item.taxPercent || 18)) / 100;
            doc.text(`${itemTax.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.igst + 25, rowY + 10, { width: 55, align: "right" });
            
            const itemTotal = itemBaseAmt + itemTax;
            doc.font("Helvetica-Bold").text(`${itemTotal.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.total, rowY + 10, { width: 80, align: "right" });
            
            rowY += itemH;
        });

        // --- TOTALS ROW ---
        const totalRowH = 20;
        doc.rect(margin, rowY, width, totalRowH).lineWidth(0.8).stroke();
        [x.qty, x.amt, x.igst + 25, x.total].forEach(posX => {
            doc.moveTo(posX, rowY).lineTo(posX, rowY + totalRowH).stroke();
        });
        doc.font("Helvetica-Bold").text("TOTAL", x.sno, rowY + 6, { width: x.qty - x.sno, align: "center" });
        const totalQty = inv.items.reduce((a, b) => a + (b.quantity || 0), 0);
        doc.text(`${totalQty}`, x.qty, rowY + 6, { width: 30, align: "center" });
        doc.text(`${(inv.subtotal || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.amt, rowY + 6, { width: 65, align: "right" });
        doc.text(`${(inv.taxAmount || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.igst + 25, rowY + 6, { width: 55, align: "right" });
        doc.text(`${(inv.grandTotal || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.total, rowY + 6, { width: 80, align: "right" });
        rowY += totalRowH;

        // --- ROUNDED OFF ROW ---
        const roundH = 35;
        doc.rect(margin, rowY, width, roundH).stroke();
        doc.fontSize(12).text(`Total Invoice Amount (Rounded off) :  Rs.${Math.round(inv.grandTotal).toLocaleString("en-IN")}`, margin, rowY + 12, { align: "center", width: width });
        rowY += roundH + 10;

        // --- FOOTER SECTION ---
        const footerH = 140;
        if (rowY + footerH > 800) {
            doc.addPage();
            rowY = 40;
        }

        // Main Footer Box
        doc.rect(margin, rowY, width, footerH).lineWidth(0.8).strokeColor("#000").stroke();
        
        // Vertical Divider
        doc.moveTo(midX, rowY).lineTo(midX, rowY + footerH).stroke();

        // Left Side: Amount in Words & Remarks
        doc.fontSize(8).font("Helvetica").text("Amount Chargeable (in words):", margin + 5, rowY + 5);
        const amountWords = numberToWords(inv.grandTotal);
        doc.fontSize(9).font("Helvetica-Bold").text(`INR ${amountWords.toUpperCase()}`, margin + 5, rowY + 15, { width: (width/2) - 10 });
        
        doc.fontSize(8).font("Helvetica").text("Remarks:", margin + 5, rowY + 75);
        doc.text(inv.notes?.split('\n')[0] || "Warranty: As per Manufacturer", margin + 5, rowY + 85, { width: (width/2) - 10 });

        // Right Side: Bank Details
        doc.fontSize(9).font("Helvetica").text("Company's Bank Details :", midX + 5, rowY + 5);
        const bankStartY = rowY + 22;
        const labelX = midX + 5;
        const valueX = midX + 105;
        const colonX = midX + 100;

        doc.fontSize(8).font("Helvetica");
        const labels = [
            "A/c Holder's Name", 
            "Bank Name", 
            "A/c no.", 
            "Branch & IFSC Code", 
            "SWIFT Code"
        ];
        const values = [
            "WEBERFOX TECHNOLOGIES PVT. LTD.",
            (bankAccount?.bankName || "AXIS BANK").toUpperCase(),
            bankAccount?.accountNumber || "921020052009341",
            `${(bankAccount?.branch || "KOCHI").toUpperCase()} & ${bankAccount?.ifsc || "UTIB0000081"}`,
            bankAccount?.swiftCode || "AXISINBB081"
        ];

        let currentBankY = bankStartY;
        labels.forEach((label, idx) => {
            const textOptions = { width: (width/2) - 110 };
            const rowH = Math.max(12, doc.heightOfString(values[idx], textOptions));
            
            doc.font("Helvetica").text(label, labelX, currentBankY);
            doc.text(":", colonX, currentBankY);
            doc.font("Helvetica-Bold").text(values[idx], valueX, currentBankY, textOptions);
            currentBankY += rowH + 2;
        });

        // Signatory box horizontal line (Placed below SWIFT code)
        const sigLineY = Math.max(rowY + 90, currentBankY + 5);
        doc.moveTo(midX, sigLineY).lineTo(endX, sigLineY).stroke();

        // Authorized Signatory section
        doc.fontSize(8).font("Helvetica-Bold").text("for WEBERFOX TECHNOLOGIES PVT. LTD.", midX + 5, sigLineY + 5, { align: "center", width: (width/2) - 10 });
        doc.fontSize(8).font("Helvetica").text("Authorized signatory", midX + 5, rowY + footerH - 15, { align: "right", width: (width/2) - 15 });

        doc.end();

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ status: false, message: error.message });
        }
    }
};
