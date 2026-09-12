import Quotation from "../models/Quotation.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Invoice from "../models/Invoice.js";
import Counter from "../models/Counter.js";
import BankAccount from "../models/BankAccount.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";


const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "").trim();

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

/** Compute line-item totals and grand total from items array */
const computeTotals = (items) => {
    let subtotal = 0;
    const computed = items.map((item) => {
        const rate = Number(item.rate) || 0;
        const qty = Number(item.qty) || 0;
        const discountPercent = Number(item.discountPercent) || 0;
        const taxPercent = Number(item.taxPercent) || 0;

        const discountAmt = (rate * discountPercent) / 100;
        const unitCost = rate - discountAmt;
        const taxAmount = (unitCost * taxPercent) / 100;
        const totalCost = (unitCost + taxAmount) * qty;

        subtotal += unitCost * qty;
        return { ...item, taxAmount: +taxAmount.toFixed(2), unitCost: +unitCost.toFixed(2), totalCost: +totalCost.toFixed(2) };
    });
    const grandTotal = computed.reduce((sum, i) => sum + i.totalCost, 0);
    return { items: computed, subtotal: +subtotal.toFixed(2), grandTotal: +grandTotal.toFixed(2) };
};

/** Format a Quotation document for API response */
const formatQuotation = (q, customer, productMap) => ({
    id: q._id,
    quotationNo: q.quotationNo,
    customerId: q.customerId,
    customerName: customer ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "",
    customerAvatar: customer?.avatar || null,
    customerAddress: customer ? `${customer.address || ""}\n${customer.city || ""} ${customer.state || ""} ${customer.postalCode || ""}`.trim() : "",
    customerGstin: customer?.gstin || "",
    date: q.date,
    validity: q.validity,
    reference: q.reference,
    quotationType: q.quotationType,
    items: (q.items || []).map((item) => ({
        id: item._id,
        productId: item.productId,
        productName: productMap?.[item.productId?.toString()] || "",
        qty: item.qty,
        rate: item.rate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        hsnSac: item.hsnSac,
        taxAmount: item.taxAmount,
        unitCost: item.unitCost,
        totalCost: item.totalCost
    })),
    subtotal: q.subtotal,
    grandTotal: q.grandTotal,
    amountInWords: q.amountInWords,
    description: q.description,
    status: q.status,
    paymentStatus: q.paymentStatus || "Unpaid",
    paidAmount: q.paidAmount || 0,
    convertedToSalesOrderId: q.convertedToSalesOrderId,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
});

// 1. GET /api/quotations 
export const getQuotations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            customerId,
            productId,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (customerId) query.customerId = customerId;

        // Search by quotation number or reference
        if (search) {
            const regex = { $regex: search, $options: "i" };
            // Also try to match customers by name
            const matchingCustomers = await Customer.find({
                $or: [
                    { firstName: regex },
                    { lastName: regex }
                ]
            }).select("_id");
            const customerIds = matchingCustomers.map((c) => c._id);

            query.$or = [
                { quotationNo: regex },
                { reference: regex },
                ...(customerIds.length > 0 ? [{ customerId: { $in: customerIds } }] : [])
            ];
        }

        if (productId) {
            query["items.productId"] = productId;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Quotation.countDocuments(query);

        const quotations = await Quotation.find(query)
            .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(Number(limit));

        // Populate customer info
        const customerIds = [...new Set(quotations.map((q) => q.customerId?.toString()))];
        const customers = await Customer.find({ _id: { $in: customerIds } });
        const customerMap = customers.reduce((acc, c) => { acc[c._id.toString()] = c; return acc; }, {});

        // Populate product names
        const allProductIds = [...new Set(quotations.flatMap((q) => q.items.map((i) => i.productId?.toString())))];
        const products = await Product.find({ _id: { $in: allProductIds } }).select("_id product");
        const productMap = products.reduce((acc, p) => { acc[p._id.toString()] = p.product; return acc; }, {});

        return res.status(200).json({
            message: "Quotations Retrieved Successfully",
            dataFound: quotations.length > 0,
            status: true,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalRecords: total,
            data: quotations.map((q) => formatQuotation(q, customerMap[q.customerId?.toString()], productMap))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

// 2. POST /api/quotations/add 
export const createQuotation = async (req, res) => {
    try {
        const {
            customerId, date, validity, reference,
            quotationType, description, status, items = [],
            paymentStatus, paidAmount
        } = req.body;

        if (!customerId) return res.status(400).json({ message: "Customer is required", status: false });
        if (!date) return res.status(400).json({ message: "Date is required", status: false });
        if (!validity) return res.status(400).json({ message: "Validity is required", status: false });
        if (!items.length) return res.status(400).json({ message: "At least one item is required", status: false });

        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: "Customer not found", status: false });

        // Auto-generate quotation number: Quote_0001_Month_Year
        const today = new Date();
        const monthName = today.toLocaleString('en-US', { month: 'long' });
        const year = today.getFullYear();
        const suffix = `_${monthName}_${year}`;
        const prefix = `Quote_`;

        const lastQ = await Quotation.findOne(
            { quotationNo: { $regex: `${suffix}$` } },
            { quotationNo: 1 }
        ).sort({ quotationNo: -1 }).lean();

        let seq = 1;
        if (lastQ) {
            const match = lastQ.quotationNo.match(/Quote_(\d+)_/);
            if (match) seq = parseInt(match[1], 10) + 1;
        }
        const quotationNo = `${prefix}${String(seq).padStart(4, "0")}${suffix}`;

        const { items: computedItems, subtotal, grandTotal } = computeTotals(items);
        const amountInWords = numberToWords(grandTotal);

        const quotation = await Quotation.create({
            quotationNo,
            customerId,
            date,
            validity,
            reference: reference || "",
            quotationType: quotationType || "Intrastate",
            items: computedItems,
            subtotal,
            grandTotal,
            amountInWords,
            description: description || "",
            status: status || "Pending",
            paymentStatus: paymentStatus || "Unpaid",
            paidAmount: paidAmount || 0
        });

        return res.status(201).json({
            message: "Quotation Created Successfully",
            dataFound: true,
            status: true,
            data: { id: quotation._id, quotationNo: quotation.quotationNo }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//3. GET /api/quotations/:id 
export const getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation not found", status: false, dataFound: false });

        const customer = await Customer.findById(quotation.customerId);

        const allProductIds = quotation.items.map((i) => i.productId?.toString());
        const products = await Product.find({ _id: { $in: allProductIds } }).select("_id product");
        const productMap = products.reduce((acc, p) => { acc[p._id.toString()] = p.product; return acc; }, {});

        return res.status(200).json({
            message: "Quotation Retrieved Successfully",
            dataFound: true,
            status: true,
            data: formatQuotation(quotation, customer, productMap)
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//  4. PUT /api/quotations/update/:id 
export const updateQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation not found", status: false, dataFound: false });

        const {
            customerId, date, validity, reference,
            quotationType, description, status, items,
            paymentStatus, paidAmount
        } = req.body;

        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (!customer) return res.status(404).json({ message: "Customer not found", status: false });
            quotation.customerId = customerId;
        }

        if (date) quotation.date = date;
        if (validity) quotation.validity = validity;
        if (reference !== undefined) quotation.reference = reference;
        if (quotationType) quotation.quotationType = quotationType;
        if (description !== undefined) quotation.description = description;
        if (status) quotation.status = status;
        if (paymentStatus) quotation.paymentStatus = paymentStatus;
        if (paidAmount !== undefined) quotation.paidAmount = paidAmount;

        if (items && items.length > 0) {
            const { items: computedItems, subtotal, grandTotal } = computeTotals(items);
            quotation.items = computedItems;
            quotation.subtotal = subtotal;
            quotation.grandTotal = grandTotal;
            quotation.amountInWords = numberToWords(grandTotal);
        }

        await quotation.save();

        return res.status(200).json({
            message: "Quotation Updated Successfully",
            dataFound: true,
            status: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//  5. DELETE /api/quotations/delete/:id 
export const deleteQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation not found", status: false, dataFound: false });

        await quotation.deleteOne();

        return res.status(200).json({
            message: "Quotation Deleted Successfully",
            dataFound: true,
            status: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//  6. PATCH /api/quotations/:id/status 
export const updateQuotationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["Pending", "Sent", "Ordered", "Converted"];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}`, status: false });
        }

        const quotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!quotation) return res.status(404).json({ message: "Quotation not found", status: false, dataFound: false });

        return res.status(200).json({
            message: "Quotation Status Updated Successfully",
            dataFound: true,
            status: true,
            data: { id: quotation._id, status: quotation.status }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//  7. POST /api/quotations/bulk-delete 
export const bulkDeleteQuotations = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of IDs", status: false });
        }
        const result = await Quotation.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            message: "Selected Quotations Deleted Successfully",
            dataFound: true,
            status: true,
            data: { requested: ids.length, deletedCount: result.deletedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//  8. POST /api/quotations/bulk-update 
export const bulkUpdateQuotations = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of IDs", status: false });
        }
        if (!status) return res.status(400).json({ message: "Status is required", status: false });

        const result = await Quotation.updateMany({ _id: { $in: ids } }, { $set: { status } });
        return res.status(200).json({
            message: "Selected Quotations Updated Successfully",
            dataFound: true,
            status: true,
            data: { requested: ids.length, updatedCount: result.modifiedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false, dataFound: false });
    }
};

//  9. GET /api/quotations/:id/export/pdf 
// 9. GET /api/quotations/:id/export/pdf  ← OPTIMIZED
export const exportSingleQuotationPdf = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).lean();
    if (!quotation) return res.status(404).json({ message: "Quotation not found", status: false });

    const allProductIds = quotation.items.map((i) => i.productId?.toString());
    const [customer, products, bankAccount] = await Promise.all([
      Customer.findById(quotation.customerId).lean(),
      Product.find({ _id: { $in: allProductIds } }).select("_id product").lean(),
      BankAccount.findOne({ isDefault: true }).lean().catch(() => null)
    ]);

    const productMap = products.reduce((acc, p) => { acc[p._id.toString()] = p.product; return acc; }, {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Quotation_${quotation.quotationNo}.pdf`);

    // Margin and Width Setup
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    const margin = 40;
    const pageWidth = 595.28;
    const tableWidth = pageWidth - (margin * 2); // 515 pts
    const endX = pageWidth - margin;

    // --- HEADER SECTION ---
    const logoPath = "d:/ERP/react/template/src/assets/img/logo.png";
    try {
        doc.image(logoPath, margin, 35, { height: 40 });
    } catch(e) {
        doc.fontSize(18).font("Helvetica-Bold").fillColor("#fe9f43").text("Dreams POS", margin, 40);
    }
    
    const rAlignX = 300;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#800040").text("Quotation From", rAlignX, 40, { align: "right", width: 255 });
    doc.fontSize(14).fillColor("#000").text("WEBERFOX TECHNOLOGIES PVT LTD.", rAlignX, 55, { align: "right", width: 255 });
    
    // Use doc.y to prevent overlapping if the company name wraps
    const addressY = Math.max(doc.y + 12, 90);
    doc.fontSize(9).font("Helvetica").text("Building No :15/538, Koivila PO.\nThevalakkara , Kollam\nPIN:691590\nPh: +91 9496269666\ne-mail: contact@weberfox.com\nGSTIN: 32AADCW0489R1ZQ", rAlignX, addressY, { align: "right", width: 255, lineGap: 3 });

    doc.fontSize(22).font("Helvetica-Bold").text("QUOTATION", margin, 90);

    doc.fontSize(9).font("Helvetica-Bold").text(`Quote Ref No: ${quotation.quotationNo}`, margin, 120);
    doc.text(`Quote Date: ${new Date(quotation.date).toLocaleDateString("en-GB")}`, margin, 133);
    doc.text(`Quote Validity: ${quotation.validity ? new Date(quotation.validity).toLocaleDateString("en-GB") : "—"}`, margin, 146);

    // Moved line down to avoid overlap with address
    doc.moveTo(margin, 190).lineTo(endX, 190).lineWidth(0.5).strokeColor("#ccc").stroke();

    // --- BILLING AND PAYMENT ---
    let midY = 200;
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000").text("Billed to", margin, midY);
    doc.text("Payment Details", rAlignX, midY, { align: "right", width: 255 });
    
    doc.fontSize(9).font("Helvetica");
    const custName = customer ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "-";
    doc.text(custName, margin, midY + 12);
    if (customer?.address) doc.text(customer.address, margin, midY + 24, { width: 220 });
    doc.font("Helvetica-Bold").text(`Place of Supply: ${quotation.quotationType || "Intrastate"}`, margin, midY + 65);

    doc.font("Helvetica").text(`Bank Acc No: ${bankAccount?.accountNumber || "12345678901796"}`, rAlignX, midY + 12, { align: "right", width: 255 });
    doc.text(`IFSC : ${bankAccount?.ifsc || "SWIS0009876"}`, rAlignX, midY + 24, { align: "right", width: 255 });
    doc.text(`${bankAccount?.bankName || "Swiss Bank"}, ${bankAccount?.branch || "Ernakulam"}`, rAlignX, midY + 36, { align: "right", width: 255 });

    doc.fontSize(10).font("Helvetica-Bold").text(`Quotation for ${quotation.description || 'phone'}`, margin, 300, { underline: true });

    // --- TABLE DEFINITION ---
    const tableTop = 325;
    const x = {
      sno: margin,           // 40
      item: margin + 25,     // 65
      hsn: margin + 125,    // 165
      qty: margin + 175,    // 215
      rate: margin + 205,   // 245
      amt: margin + 275,    // 315
      igst: margin + 345,   // 385
      total: margin + 430   // 470
    };

    // Table Header Background and Outline
    doc.rect(x.sno, tableTop, tableWidth, 45).lineWidth(0.8).strokeColor("#000").stroke();
    
    // Header Vertical Lines
    [x.item, x.hsn, x.qty, x.rate, x.amt, x.igst, x.total].forEach(posX => {
      doc.moveTo(posX, tableTop).lineTo(posX, tableTop + 45).stroke();
    });
    // IGST Splitter
    doc.moveTo(x.igst, tableTop + 22).lineTo(x.total, tableTop + 22).stroke();
    doc.moveTo(x.igst + 25, tableTop + 22).lineTo(x.igst + 25, tableTop + 45).stroke();

    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("Sl.\nNo.", x.sno, tableTop + 12, { width: 25, align: "center" });
    doc.text("Item &\nDescription", x.item + 5, tableTop + 12, { width: 95, align: "center" });
    doc.text("HSN/SAC", x.hsn, tableTop + 18, { width: 50, align: "center" });
    doc.text("Qty.", x.qty, tableTop + 18, { width: 30, align: "center" });
    doc.text("Rate", x.rate, tableTop + 18, { width: 70, align: "center" });
    doc.text("Amt.", x.amt, tableTop + 18, { width: 70, align: "center" });
    doc.text("IGST", x.igst, tableTop + 7, { width: 85, align: "center" });
    doc.text("%", x.igst, tableTop + 28, { width: 25, align: "center" });
    doc.text("Amt.", x.igst + 25, tableTop + 28, { width: 60, align: "center" });
    doc.text("Total Amount\n(Inc. IGST)", x.total, tableTop + 12, { width: 85, align: "center" });

    let rowY = tableTop + 45;
    doc.font("Helvetica").fontSize(8);

    quotation.items.forEach((item, i) => {
      const rowHeight = 25;
      doc.rect(x.sno, rowY, tableWidth, rowHeight).stroke();
      
      // Row Vertical Lines
      [x.item, x.hsn, x.qty, x.rate, x.amt, x.igst, x.igst + 25, x.total].forEach(posX => {
        doc.moveTo(posX, rowY).lineTo(posX, rowY + rowHeight).stroke();
      });

      doc.text(`${i + 1}`, x.sno, rowY + 8, { width: 25, align: "center" });
      doc.font("Helvetica-Bold").text(productMap[item.productId?.toString()] || "-", x.item + 5, rowY + 8, { width: 95, height: 15, ellipsis: true });
      doc.font("Helvetica").text(item.hsnSac || "-", x.hsn, rowY + 8, { width: 50, align: "center" });
      doc.text(`${item.qty}`, x.qty, rowY + 8, { width: 30, align: "center" });
      doc.text(`${item.rate.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.rate, rowY + 8, { width: 65, align: "right" });
      doc.text(`${(item.qty * item.rate).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.amt, rowY + 8, { width: 65, align: "right" });
      doc.text(`${item.taxPercent}`, x.igst, rowY + 8, { width: 25, align: "center" });
      doc.text(`${(item.taxAmount || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.igst + 25, rowY + 8, { width: 55, align: "right" });
      doc.font("Helvetica-Bold").text(`${item.totalCost.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.total, rowY + 8, { width: 80, align: "right" });
      rowY += rowHeight;
    });

    // TOTAL ROW
    doc.rect(x.sno, rowY, tableWidth, 20).fillAndStroke("#f9f9f9", "#000");
    doc.fillColor("#000").font("Helvetica-Bold").text("TOTAL", x.sno, rowY + 6, { align: "center", width: x.qty - x.sno });
    doc.text(`${quotation.items.reduce((a, b) => a + b.qty, 0)}`, x.qty, rowY + 6, { width: 30, align: "center" });
    doc.text(`${quotation.subtotal.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.amt, rowY + 6, { width: 65, align: "right" });
    doc.text(`${quotation.items.reduce((a,b) => a + (b.taxAmount||0), 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.igst + 25, rowY + 6, { width: 55, align: "right" });
    doc.text(`${quotation.grandTotal.toLocaleString("en-IN", {minimumFractionDigits: 2})}`, x.total, rowY + 6, { width: 80, align: "right" });
    
    rowY += 20;
    doc.rect(x.sno, rowY, tableWidth, 25).stroke();
    doc.fontSize(10).text(`Total Invoice Amount (Rounded off) :  Rs.${Math.round(quotation.grandTotal).toLocaleString("en-IN")}`, x.sno, rowY + 7, { align: "center", width: tableWidth });

    // --- FOOTER SECTION ---
    rowY += 35;
    const footerH = 140;
    if (rowY + footerH > 800) {
        doc.addPage();
        rowY = 40;
    }

    // Main Footer Box
    doc.rect(margin, rowY, tableWidth, footerH).lineWidth(0.8).strokeColor("#000").stroke();
    
    // Vertical Divider
    const midX = margin + (tableWidth / 2);
    doc.moveTo(midX, rowY).lineTo(midX, rowY + footerH).stroke();
    
    // Left Side: Amount in Words & Remarks
    doc.fontSize(8).font("Helvetica").text("Amount Chargeable (in words):", margin + 5, rowY + 5);
    const amountWords = numberToWords(quotation.grandTotal);
    doc.fontSize(9).font("Helvetica-Bold").text(`INR ${amountWords.toUpperCase()}`, margin + 5, rowY + 15, { width: (tableWidth/2) - 10 });
    
    doc.fontSize(8).font("Helvetica").text("Remarks:", margin + 5, rowY + 75);
    doc.text(quotation.description || 'Warranty: As per Manufacturer', margin + 5, rowY + 85, { width: (tableWidth/2) - 10 });

    // Right Side: Bank Details
    doc.fontSize(9).font("Helvetica").text("Company's Bank Details :", midX + 5, rowY + 5);
    const bankStartY = rowY + 22;
    const labelX = midX + 5;
    const valueX = midX + 105;
    const colonX = midX + 100;

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
        const textOptions = { width: (tableWidth/2) - 110 };
        const rowH = Math.max(12, doc.heightOfString(values[idx], textOptions));
        
        doc.font("Helvetica").text(label, labelX, currentBankY);
        doc.text(":", colonX, currentBankY);
        doc.font("Helvetica-Bold").text(values[idx], valueX, currentBankY, textOptions);
        
        currentBankY += rowH + 2; 
    });

    // Signatory box horizontal line (Placed below bank details)
    const sigLineY = Math.max(rowY + 90, currentBankY + 5);
    doc.moveTo(midX, sigLineY).lineTo(endX, sigLineY).stroke();

    // Authorized Signatory section
    doc.fontSize(8).font("Helvetica-Bold").text("for WEBERFOX TECHNOLOGIES PVT. LTD.", midX + 5, sigLineY + 5, { align: "center", width: (tableWidth/2) - 10 });
    doc.fontSize(8).font("Helvetica").text("Authorized signatory", midX + 5, rowY + footerH - 15, { align: "right", width: (tableWidth/2) - 15 });

    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: error.message, status: false });
  }
};


//  10. GET /api/quotations/export/pdf - OPTIMIZED with pagination
export const exportQuotationsPdf = async (req, res) => {
    try {
        // ✅ Support optional pagination: ?limit=100&page=1
        const limit = Math.min(Number(req.query.limit) || 500, 1000); // Max 1000 per request
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        // ✅ Use .lean() for faster queries + field projection
        const quotations = await Quotation.find({})
            .select("quotationNo customerId date validity quotationType grandTotal status")
            .lean()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // ✅ Batch fetch customer names
        const customerIds = [...new Set(quotations.map((q) => q.customerId?.toString()))];
        const customers = await Customer.find({ _id: { $in: customerIds } })
            .select("_id firstName lastName")
            .lean();
        const customerMap = customers.reduce((acc, c) => { 
            acc[c._id.toString()] = c; 
            return acc; 
        }, {});

        // ✅ Set headers BEFORE doc generation - enables streaming
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=quotations-${Date.now()}.pdf`);

        const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40, bufferPages: true });
        doc.pipe(res);

        doc.fontSize(20).font("Helvetica-Bold").fillColor("#fe9f43").text("DreamsPOS ERP – Quotation List", { align: "center" });
        doc.fontSize(9).font("Helvetica").fillColor("#666").text(`Generated: ${new Date().toLocaleDateString()}`, { align: "right" });
        doc.moveDown();

        const tTop = doc.y;
        const cols = { sno: 30, no: 60, customer: 160, date: 280, validity: 340, type: 410, total: 490, status: 570 };

        doc.rect(25, tTop, 790, 20).fill("#4472C4");
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#fff");
        doc.text("#", cols.sno, tTop + 5);
        doc.text("Quotation No", cols.no, tTop + 5);
        doc.text("Customer", cols.customer, tTop + 5, { width: 110 });
        doc.text("Date", cols.date, tTop + 5);
        doc.text("Validity", cols.validity, tTop + 5);
        doc.text("Type", cols.type, tTop + 5);
        doc.text("Grand Total", cols.total, tTop + 5);
        doc.text("Status", cols.status, tTop + 5);

        let rowY = tTop + 24;
        doc.font("Helvetica").fillColor("#333").fontSize(9);

        const statusColors = { Converted: "#27c59a", Sent: "#27c59a", Ordered: "#f0ad4e", Pending: "#999" };

        quotations.forEach((q, i) => {
            if (rowY > 530) { doc.addPage({ size: "A4", layout: "landscape", margin: 40 }); rowY = 50; }
            if (i % 2 === 0) doc.rect(25, rowY - 3, 790, 18).fill("#f9f9f9");

            const customer = customerMap[q.customerId?.toString()];
            const custName = customer ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "-";

            doc.fillColor("#333");
            doc.text(`${i + 1}`, cols.sno, rowY);
            doc.text(q.quotationNo, cols.no, rowY, { width: 95 });
            doc.text(custName, cols.customer, rowY, { width: 110, ellipsis: true });
            doc.text(new Date(q.date).toLocaleDateString(), cols.date, rowY);
            doc.text(new Date(q.validity).toLocaleDateString(), cols.validity, rowY);
            doc.text(q.quotationType, cols.type, rowY);
            doc.text(`₹${q.grandTotal.toFixed(2)}`, cols.total, rowY);
            doc.fillColor(statusColors[q.status] || "#333").text(q.status, cols.status, rowY);

            rowY += 20;
        });

        // Page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor("#aaa").text(`Page ${i + 1} of ${pages.count}`, 40, doc.page.height - 30, { align: "center" });
        }
        doc.end(); // ✅ Flushes pipe to response
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: error.message, status: false });
        }
    }
};

//  11. GET /api/quotations/export/xlsx - OPTIMIZED with pagination
export const exportQuotationsXlsx = async (req, res) => {
    try {
        // ✅ Support optional pagination: ?limit=500&page=1
        const limit = Math.min(Number(req.query.limit) || 500, 2000); // Max 2000 per request
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        // ✅ Use .lean() for faster queries + field projection
        const quotations = await Quotation.find({})
            .select("quotationNo customerId date validity quotationType reference subtotal grandTotal amountInWords status createdAt")
            .lean()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // ✅ Batch fetch customer names
        const customerIds = [...new Set(quotations.map((q) => q.customerId?.toString()))];
        const customers = await Customer.find({ _id: { $in: customerIds } })
            .select("_id firstName lastName")
            .lean();
        const customerMap = customers.reduce((acc, c) => { acc[c._id.toString()] = c; return acc; }, {});

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet("Quotations");

        ws.columns = [
            { header: "S.No", key: "sno", width: 7 },
            { header: "Quotation No", key: "quotationNo", width: 22 },
            { header: "Customer", key: "customer", width: 25 },
            { header: "Date", key: "date", width: 15 },
            { header: "Validity", key: "validity", width: 15 },
            { header: "Type", key: "type", width: 15 },
            { header: "Reference", key: "reference", width: 18 },
            { header: "Subtotal (₹)", key: "subtotal", width: 16 },
            { header: "Grand Total (₹)", key: "grandTotal", width: 18 },
            { header: "Amount Words", key: "amountInWords", width: 40 },
            { header: "Status", key: "status", width: 13 },
            { header: "Created At", key: "createdAt", width: 18 }
        ];

        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

        quotations.forEach((q, i) => {
            const customer = customerMap[q.customerId?.toString()];
            const custName = customer ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "-";

            ws.addRow({
                sno: i + 1,
                quotationNo: q.quotationNo,
                customer: custName,
                date: q.date ? new Date(q.date).toLocaleDateString() : "-",
                validity: q.validity ? new Date(q.validity).toLocaleDateString() : "-",
                type: q.quotationType,
                reference: q.reference || "-",
                subtotal: q.subtotal,
                grandTotal: q.grandTotal,
                amountInWords: q.amountInWords,
                status: q.status,
                createdAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "-"
            });
        });

        ws.autoFilter = { from: "A1", to: "L1" };

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=quotations-${Date.now()}.xlsx`);
        
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//  12. GET /api/quotations/generate-number 
export const generateQuotationNumber = async (req, res) => {
    try {
        const today = new Date();
        const monthName = today.toLocaleString('en-US', { month: 'long' });
        const year = today.getFullYear();
        const suffix = `_${monthName}_${year}`;
        const prefix = `Quote_`;

        const lastQ = await Quotation.findOne(
            { quotationNo: { $regex: `${suffix}$` } },
            { quotationNo: 1 }
        ).sort({ quotationNo: -1 }).lean();

        let seq = 1;
        if (lastQ) {
            const match = lastQ.quotationNo.match(/Quote_(\d+)_/);
            if (match) seq = parseInt(match[1], 10) + 1;
        }
        const quotationNo = `${prefix}${String(seq).padStart(4, "0")}${suffix}`;

        return res.status(200).json({
            message: "Quotation Number Generated Successfully",
            quotationNo,
            status: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//  13. POST /api/quotations/:id/convert 
export const convertQuotationToInvoice = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) {
            return res.status(404).json({ message: "Quotation not found", status: false });
        }

        if (quotation.status === "Converted") {
            return res.status(400).json({ message: "Quotation has already been converted", status: false });
        }

        // 1. Generate Numbers (####_month_year_nextyear and SALE####)
        const today = new Date();
        const monthName = today.toLocaleString('en-US', { month: 'long' });
        const year = today.getFullYear();
        const nextYear = year + 1;
        const suffix = `_${monthName}_${year}_${nextYear}`;

        const lastInv = await Invoice.findOne({ invoiceNumber: { $regex: `${suffix}$` } }).sort({ invoiceNumber: -1 });
        let seq = 1;
        if (lastInv) {
            const match = lastInv.invoiceNumber.match(/^(\d+)_/);
            if (match) seq = parseInt(match[1], 10) + 1;
        }
        const invoiceNumber = `${String(seq).padStart(4, "0")}${suffix}`;

        // Forever Sequential Sale Number
        const counterRecord = await Counter.findOneAndUpdate(
            { id: "saleNumber" },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        );
        const saleNumber = `SALE${String(counterRecord.seq).padStart(4, "0")}`;

        // 2. Map Items
        const productIds = quotation.items.map(i => i.productId);
        const products = await Product.find({ _id: { $in: productIds } }).select("_id product");
        const productMap = products.reduce((acc, p) => { acc[p._id.toString()] = p.product; return acc; }, {});

        const invoiceItems = quotation.items.map(item => {
            const discAmt = (item.rate * item.qty * item.discountPercent / 100);
            return {
                productId: item.productId,
                productName: productMap[item.productId.toString()] || "Unknown Product",
                quantity: item.qty,
                rate: item.rate,
                discount: +discAmt.toFixed(2),
                taxPercent: item.taxPercent,
                amount: item.totalCost
            };
        });


        // 3. Create Invoice
        const invoice = await Invoice.create({
            type: "Invoice",
            invoiceNumber,
            saleNumber,
            invoiceType: quotation.quotationType || "Intrastate",
            customerId: quotation.customerId,
            invoiceDate: today,
            dueDate: quotation.validity || new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            paymentStatus: quotation.paymentStatus || "Unpaid",
            paidAmount: quotation.paidAmount || 0,
            items: invoiceItems,
            subtotal: quotation.subtotal,
            taxAmount: +(quotation.grandTotal - quotation.subtotal).toFixed(2),
            grandTotal: quotation.grandTotal,
            notes: `Converted from Quotation: ${quotation.quotationNo}`,
            terms: quotation.description
        });

        // 4. Update Quotation
        quotation.status = "Converted";
        quotation.convertedToSalesOrderId = invoice._id;
        await quotation.save();

        return res.status(200).json({
            message: "Quotation Converted to Invoice Successfully",
            status: true,
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber
        });
    } catch (error) {
        console.error("Conversion Error:", error);
        res.status(500).json({ message: error.message, status: false });
    }
};
