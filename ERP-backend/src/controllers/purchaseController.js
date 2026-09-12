import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// 1. GET /api/purchases
export const getPurchases = async (req, res) => {
    try {
        const { search, status, paymentStatus, page = 1, limit = 10 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { supplierName: { $regex: search, $options: "i" } },
                { reference: { $regex: search, $options: "i" } }
            ];
        }

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const skip = (page - 1) * limit;
        const purchases = await Purchase.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Purchase.countDocuments(query);

        res.status(200).json({
            status: true,
            message: "Purchases retrieved successfully",
            data: purchases,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get purchases failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// 2. POST /api/purchases/add
export const createPurchase = async (req, res) => {
    try {
        const {
            supplierName,
            date,
            reference,
            status,
            orderTax,
            discount,
            shipping,
            grandTotal,
            paidAmount,
            items = []
        } = req.body;

        if (!supplierName || orderTax === "" || !grandTotal) {
            return res.status(400).json({ 
                status: false, 
                message: "Supplier Name, Tax Type, and Grand Total are required fields." 
            });
        }
        const lastPurchase = await Purchase.findOne().sort({ createdAt: -1 });
        let nextNumber = 1;
        if (lastPurchase && lastPurchase.purchaseNumber) {
            const lastNum = parseInt(lastPurchase.purchaseNumber.replace("PR-", ""));
            if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        const purchaseNumber = `PR-${nextNumber.toString().padStart(4, "0")}`;

        const newPurchase = new Purchase({
            purchaseNumber,
            supplierName,
            date,
            reference,
            status,
            orderTax: Number(orderTax) || 0,
            discount: Number(discount) || 0,
            shipping: Number(shipping) || 0,
            grandTotal: Number(grandTotal) || 0,
            paidAmount: Number(paidAmount) || 0,
            items
        });

        await newPurchase.save();

        // --- UPDATE STOCK (INCREMENT) ---
        if (newPurchase.items && newPurchase.items.length > 0) {
            for (const item of newPurchase.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity = (product.quantity || 0) + (Number(item.quantity) || 0);
                        if (product.quantity > 0 && product.status === "Out of Stock") {
                            product.status = "Available";
                        }
                        await product.save();
                    }
                }
            }
        }

        res.status(201).json({
            status: true,
            message: "Purchase created successfully",
            data: newPurchase
        });
    } catch (error) {
        console.error("Create purchase failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// 3. DELETE /api/purchases/delete/:id
export const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findById(id);

        if (!purchase) {
            return res.status(404).json({ status: false, message: "Purchase not found" });
        }

        // --- REVERSE STOCK (DECREMENT) ---
        if (purchase.items && purchase.items.length > 0) {
            for (const item of purchase.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity = Math.max(0, (product.quantity || 0) - (Number(item.quantity) || 0));
                        if (product.quantity <= 0) {
                            product.status = "Out of Stock";
                        }
                        await product.save();
                    }
                }
            }
        }

        await Purchase.findByIdAndDelete(id);

        res.status(200).json({
            status: true,
            message: "Purchase deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
// 4. GET /api/purchases/:id
export const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findById(id);

        if (!purchase) {
            return res.status(404).json({ status: false, message: "Purchase not found" });
        }

        res.status(200).json({
            status: true,
            data: purchase
        });
    } catch (error) {
        console.error("Get purchase by ID failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// 5. PUT /api/purchases/update/:id
export const updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.supplierName === "" || updateData.orderTax === "" || !updateData.grandTotal) {
            return res.status(400).json({ 
                status: false, 
                message: "Supplier Name, Tax Type, and Grand Total are required." 
            });
        }

        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({ status: false, message: "Purchase not found" });
        }

        // --- 1. REVERSE OLD STOCK ---
        if (purchase.items && purchase.items.length > 0) {
            for (const item of purchase.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity = Math.max(0, (product.quantity || 0) - (Number(item.quantity) || 0));
                        if (product.quantity <= 0) product.status = "Out of Stock";
                        await product.save();
                    }
                }
            }
        }

        // --- 2. APPLY UPDATES ---
        Object.keys(updateData).forEach(key => {
            purchase[key] = updateData[key];
        });
        await purchase.save();

        // --- 3. APPLY NEW STOCK ---
        if (purchase.items && purchase.items.length > 0) {
            for (const item of purchase.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity = (product.quantity || 0) + (Number(item.quantity) || 0);
                        if (product.quantity > 0 && product.status === "Out of Stock") {
                            product.status = "Available";
                        }
                        await product.save();
                    }
                }
            }
        }

        res.status(200).json({
            status: true,
            message: "Purchase updated successfully",
            data: purchase
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 6. POST /api/purchases/bulk-delete
export const bulkDeletePurchases = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ status: false, message: "No IDs provided" });
        }

        const purchases = await Purchase.find({ _id: { $in: ids } });

        // --- REVERSE STOCK (DECREMENT) ---
        for (const purchase of purchases) {
            if (purchase.items && purchase.items.length > 0) {
                for (const item of purchase.items) {
                    if (item.productId) {
                        const product = await Product.findById(item.productId);
                        if (product) {
                            product.quantity = Math.max(0, (product.quantity || 0) - (Number(item.quantity) || 0));
                            if (product.quantity <= 0) {
                                product.status = "Out of Stock";
                            }
                            await product.save();
                        }
                    }
                }
            }
        }

        await Purchase.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            status: true,
            message: `${ids.length} purchases deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// 6. POST /api/purchases/bulk-update
export const bulkUpdatePurchases = async (req, res) => {
    try {
        const { ids, updateData } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ status: false, message: "No IDs provided" });
        }

        await Purchase.updateMany(
            { _id: { $in: ids } },
            { $set: updateData }
        );

        res.status(200).json({
            status: true,
            message: `${ids.length} purchases updated successfully`
        });
    } catch (error) {
        console.error("Bulk update failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// 7. GET /api/purchases/export/pdf
export const exportPurchasesPdf = async (req, res) => {
    try {
        const purchases = await Purchase.find({}).sort({ createdAt: -1 });

        const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40, bufferPages: true });
        const chunks = [];
        doc.on("data", (c) => chunks.push(c));
        doc.on("end", () => {
            const buffer = Buffer.concat(chunks);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=purchases-${Date.now()}.pdf`);
            res.send(buffer);
        });

        doc.fontSize(20).font("Helvetica-Bold").fillColor("#fe9f43").text("DreamsPOS ERP – Purchase List", { align: "center" });
        doc.fontSize(9).font("Helvetica").fillColor("#666").text(`Generated: ${new Date().toLocaleDateString()}`, { align: "right" });
        doc.moveDown();

        const tTop = doc.y;
        const cols = { sno: 30, pid: 60, supplier: 130, ref: 250, date: 350, total: 420, paid: 490, due: 560, status: 640, payment: 720 };

        doc.rect(25, tTop, 790, 20).fill("#4472C4");
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#fff");
        doc.text("#", cols.sno, tTop + 5);
        doc.text("Purchase ID", cols.pid, tTop + 5);
        doc.text("Supplier", cols.supplier, tTop + 5);
        doc.text("Reference", cols.ref, tTop + 5);
        doc.text("Date", cols.date, tTop + 5);
        doc.text("Total", cols.total, tTop + 5);
        doc.text("Paid", cols.paid, tTop + 5);
        doc.text("Due", cols.due, tTop + 5);
        doc.text("Status", cols.status, tTop + 5);
        doc.text("Payment", cols.payment, tTop + 5);

        let rowY = tTop + 24;
        doc.font("Helvetica").fillColor("#333").fontSize(9);

        purchases.forEach((p, i) => {
            if (rowY > 530) { doc.addPage({ size: "A4", layout: "landscape", margin: 40 }); rowY = 50; }
            if (i % 2 === 0) doc.rect(25, rowY - 3, 790, 18).fill("#f9f9f9");

            doc.fillColor("#333");
            doc.text(`${i + 1}`, cols.sno, rowY);
            doc.text(p.purchaseNumber || "-", cols.pid, rowY);
            doc.text(p.supplierName || "-", cols.supplier, rowY, { width: 110, ellipsis: true });
            doc.text(p.reference || "-", cols.ref, rowY, { width: 90, ellipsis: true });
            doc.text(new Date(p.date || p.createdAt).toLocaleDateString(), cols.date, rowY);
            doc.text(`Rs. ${(p.grandTotal || 0).toFixed(2)}`, cols.total, rowY);
            doc.text(`Rs. ${(p.paidAmount || 0).toFixed(2)}`, cols.paid, rowY);
            doc.text(`Rs. ${(p.dueAmount || 0).toFixed(2)}`, cols.due, rowY);
            doc.text(p.status || "-", cols.status, rowY);
            doc.text(p.paymentStatus || "-", cols.payment, rowY);

            rowY += 20;
        });

        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor("#aaa").text(`Page ${i + 1} of ${pages.count}`, 40, doc.page.height - 30, { align: "center" });
        }
        doc.end();
    } catch (error) {
        console.error("PDF Export failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// 8. GET /api/purchases/export/xlsx
export const exportPurchasesXlsx = async (req, res) => {
    try {
        const purchases = await Purchase.find({}).sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet("Purchases");

        ws.columns = [
            { header: "S.No", key: "sno", width: 7 },
            { header: "Purchase ID", key: "purchaseNumber", width: 15 },
            { header: "Supplier", key: "supplier", width: 25 },
            { header: "Reference", key: "reference", width: 20 },
            { header: "Date", key: "date", width: 15 },
            { header: "Total (Rs.)", key: "total", width: 15 },
            { header: "Paid (Rs.)", key: "paid", width: 15 },
            { header: "Due (Rs.)", key: "due", width: 15 },
            { header: "Status", key: "status", width: 13 },
            { header: "Payment Status", key: "paymentStatus", width: 18 }
        ];

        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

        purchases.forEach((p, i) => {
            ws.addRow({
                sno: i + 1,
                purchaseNumber: p.purchaseNumber || "-",
                supplier: p.supplierName || "-",
                reference: p.reference || "-",
                date: p.date ? new Date(p.date).toLocaleDateString() : "-",
                total: p.grandTotal || 0,
                paid: p.paidAmount || 0,
                due: p.dueAmount || 0,
                status: p.status || "-",
                paymentStatus: p.paymentStatus || "-"
            });
        });

        ws.autoFilter = { from: "A1", to: "J1" };

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=purchases-${Date.now()}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error("Excel Export failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};
