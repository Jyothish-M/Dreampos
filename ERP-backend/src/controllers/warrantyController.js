import Warranty from "../models/Warranty.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// Helper to strip HTML tags from rich-text description for exports
const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "").trim();

// GET /api/warranties – get all (supports limit=0 for full client-side list)
export const getWarranties = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (parseInt(limit) === 0) {
            const warranties = await Warranty.find(query).sort({ createdAt: -1 });
            return res.status(200).json({
                message: "Warranties Retrieved Successfully",
                status: true,
                data: warranties.map(w => formatWarranty(w))
            });
        }

        const warranties = await Warranty.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const count = await Warranty.countDocuments(query);

        res.status(200).json({
            message: "Warranties Retrieved Successfully",
            status: true,
            data: warranties.map(w => formatWarranty(w)),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/warranties/:id
export const getWarranty = async (req, res) => {
    try {
        const warranty = await Warranty.findById(req.params.id);
        if (!warranty) {
            return res.status(404).json({ message: "Warranty not found", status: false });
        }
        res.status(200).json({
            message: "Warranty Retrieved Successfully",
            status: true,
            data: formatWarranty(warranty)
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// POST /api/warranties
export const createWarranty = async (req, res) => {
    try {
        const { name, duration, type, description, status } = req.body;

        const exists = await Warranty.findOne({ name });
        if (exists) {
            return res.status(400).json({
                message: "A warranty with this name already exists",
                status: false
            });
        }

        const warranty = await Warranty.create({ name, duration, type, description, status });

        res.status(201).json({
            message: "Warranty Created Successfully",
            status: true,
            data: {
                id: warranty._id,
                name: warranty.name,
                duration: warranty.duration,
                type: warranty.type,
                status: warranty.status,
                createdAt: warranty.createdAt.toISOString().split("T")[0]
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// PUT /api/warranties/:id
export const updateWarranty = async (req, res) => {
    try {
        const { name, duration, type, description, status } = req.body;
        const warranty = await Warranty.findById(req.params.id);

        if (!warranty) {
            return res.status(404).json({ message: "Warranty not found", status: false });
        }

        if (name && name !== warranty.name) {
            const exists = await Warranty.findOne({ name, _id: { $ne: req.params.id } });
            if (exists) {
                return res.status(400).json({
                    message: "A warranty with this name already exists",
                    status: false
                });
            }
        }

        warranty.name = name ?? warranty.name;
        warranty.duration = duration ?? warranty.duration;
        warranty.type = type ?? warranty.type;
        warranty.description = description ?? warranty.description;
        warranty.status = status ?? warranty.status;

        const updated = await warranty.save();

        res.status(200).json({
            message: "Warranty Updated Successfully",
            status: true,
            data: {
                id: updated._id,
                updatedAt: updated.updatedAt.toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// DELETE /api/warranties/:id
export const deleteWarranty = async (req, res) => {
    try {
        const warranty = await Warranty.findById(req.params.id);
        if (!warranty) {
            return res.status(404).json({ message: "Warranty not found", status: false });
        }
        const id = warranty._id;
        await warranty.deleteOne();
        res.status(200).json({ message: "Warranty Deleted Successfully", status: true, data: { id } });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// POST /api/warranties/bulk-delete
export const bulkDeleteWarranties = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of IDs to delete", status: false });
        }
        const result = await Warranty.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            message: "Warranties Deleted Successfully",
            status: true,
            data: { requested: ids.length, deletedCount: result.deletedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// POST /api/warranties/bulk-update
export const bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of IDs to update", status: false });
        }
        if (!status) {
            return res.status(400).json({ message: "Please provide a status to update", status: false });
        }
        const result = await Warranty.updateMany({ _id: { $in: ids } }, { $set: { status } });
        res.status(200).json({
            message: "Warranties Updated Successfully",
            status: true,
            data: { requested: ids.length, updatedCount: result.modifiedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/warranties/export?format=xlsx|pdf
export const exportWarranties = async (req, res) => {
    try {
        const { format } = req.query;
        const warranties = await Warranty.find({}).sort({ createdAt: -1 });

        if (format === "xlsx") {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Warranties");
            worksheet.columns = [
                { header: "S.No", key: "sno", width: 8 },
                { header: "Name", key: "name", width: 25 },
                { header: "Duration", key: "duration", width: 15 },
                { header: "Type", key: "type", width: 12 },
                { header: "Description", key: "description", width: 40 },
                { header: "Status", key: "status", width: 12 },
                { header: "Created At", key: "createdAt", width: 18 }
            ];
            warranties.forEach((w, i) => {
                worksheet.addRow({
                    sno: i + 1,
                    name: w.name,
                    duration: `${w.duration} ${w.type}`,
                    type: w.type,
                    description: stripHtml(w.description),
                    status: w.status,
                    createdAt: w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "-"
                });
            });
            worksheet.autoFilter = { from: "A1", to: "G1" };
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=warranties.xlsx");
            await workbook.xlsx.write(res);
            res.end();

        } else if (format === "pdf") {
            const doc = new PDFDocument({ margin: 30, size: "A4" });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=warranties.pdf");
            doc.pipe(res);

            doc.fontSize(18).text("Warranties List", { align: "center" });
            doc.moveDown(0.5);

            const tableTop = doc.y;
            const col = { sno: 30, name: 75, duration: 210, description: 295, status: 470 };
            const rowH = 30;
            let y = tableTop;

            const drawHeader = (yPos) => {
                doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
                doc.text("S.No", col.sno, yPos);
                doc.text("Name", col.name, yPos);
                doc.text("Duration", col.duration, yPos);
                doc.text("Description", col.description, yPos, { width: 165 });
                doc.text("Status", col.status, yPos);
                doc.moveTo(30, yPos + 14).lineTo(560, yPos + 14).strokeColor("#cccccc").stroke();
                doc.font("Helvetica").fillColor("black").strokeColor("black");
            };

            drawHeader(y);
            y += 20;

            warranties.forEach((w, i) => {
                const desc = stripHtml(w.description);
                const descLines = Math.ceil(desc.length / 55) || 1;
                const rowHeight = Math.max(rowH, descLines * 13 + 8);

                if (y + rowHeight > 760) {
                    doc.addPage();
                    y = 50;
                    drawHeader(y);
                    y += 20;
                }

                doc.fontSize(9).fillColor("black");
                doc.text(`${i + 1}`, col.sno, y);
                doc.text(w.name || "-", col.name, y, { width: 130 });
                doc.text(`${w.duration} ${w.type}`, col.duration, y, { width: 80 });
                doc.text(desc || "-", col.description, y, { width: 165 });
                doc.fillColor(w.status === "Active" ? "green" : "red")
                    .text(w.status, col.status, y);
                doc.fillColor("black");

                y += rowHeight;
                doc.moveTo(30, y - 4).lineTo(560, y - 4).strokeColor("#eeeeee").stroke().strokeColor("black");
            });

            doc.end();
        } else {
            res.status(400).json({ message: "Invalid format. Use 'xlsx' or 'pdf'.", status: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message, status: false });
    }
};

// Helper
const formatWarranty = (w) => ({
    id: w._id,
    name: w.name,
    duration: w.duration,
    type: w.type,
    description: w.description,
    status: w.status,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt
});
