
import Unit from "../models/Unit.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// Get single unit GET /api/units/:id
export const getUnit = async (req, res) => {
    try {
        const unit = await Unit.findById(req.params.id);

        if (!unit) {
            return res.status(404).json({
                message: "Unit not found",
                status: false,
            });
        }

        res.status(200).json({
            message: "Unit Retrieved Successfully",
            status: true,
            data: {
                id: unit._id,
                name: unit.name,
                shortName: unit.shortName,
                status: unit.status,
                createdAt: unit.createdAt.toISOString().split('T')[0],
                updatedAt: unit.updatedAt.toISOString().split('T')[0]
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Create unit POST /api/units
export const createUnit = async (req, res) => {
    try {
        const { name, shortName, status } = req.body;

        // Check if unit exists
        const unitExists = await Unit.findOne({
            $or: [{ name }, { shortName }]
        });

        if (unitExists) {
            return res.status(400).json({
                message: "Unit with this name or short name already exists",
                status: false,
            });
        }

        const unit = await Unit.create({
            name,
            shortName,
            status
        });

        res.status(201).json({
            message: "Unit Created Successfully",
            status: true,
            data: {
                id: unit._id,
                name: unit.name,
                shortName: unit.shortName,
                status: unit.status,
                createdAt: unit.createdAt.toISOString().split('T')[0]
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Update unit PUT /api/units/:id
export const updateUnit = async (req, res) => {
    try {
        const { name, shortName, status } = req.body;
        const unit = await Unit.findById(req.params.id);

        if (!unit) {
            return res.status(404).json({
                message: "Unit not found",
                status: false,
            });
        }

        if (name || shortName) {
            const existingUnit = await Unit.findOne({
                $or: [{ name }, { shortName }],
                _id: { $ne: req.params.id }
            });

            if (existingUnit) {
                return res.status(400).json({
                    message: "Unit with this name or short name already exists",
                    status: false
                });
            }
        }

        unit.name = name || unit.name;
        unit.shortName = shortName || unit.shortName;
        unit.status = status || unit.status;

        const updatedUnit = await unit.save();

        res.status(200).json({
            message: "Unit Updated Successfully",
            status: true,
            data: {
                id: updatedUnit._id,
                updatedAt: updatedUnit.updatedAt.toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Delete unit DELETE /api/units/:id
export const deleteUnit = async (req, res) => {
    try {
        const unit = await Unit.findById(req.params.id);

        if (!unit) {
            return res.status(404).json({
                message: "Unit not found",
                status: false,
            });
        }

        const id = unit._id;
        await unit.deleteOne();

        res.status(200).json({
            message: "Unit Deleted Successfully",
            status: true,
            data: { id }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Bulk Delete units POST /api/units/bulk-delete
export const bulkDeleteUnits = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of IDs to delete",
                status: false
            });
        }

        const result = await Unit.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: "Units Deleted Successfully",
            status: true,
            data: {
                requested: ids.length,
                deletedCount: result.deletedCount
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Bulk Update Status units POST /api/units/bulk-update
export const bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of IDs to update",
                status: false
            });
        }

        if (!status) {
            return res.status(400).json({
                message: "Please provide a status to update",
                status: false
            });
        }

        const result = await Unit.updateMany(
            { _id: { $in: ids } },
            { $set: { status: status } }
        );

        res.status(200).json({
            message: "Units Updated Successfully",
            status: true,
            data: {
                requested: ids.length,
                updatedCount: result.modifiedCount,
                updatedStatus: status
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Export units GET /api/units/export
export const exportUnits = async (req, res) => {
    try {
        const { format } = req.query;
        const units = await Unit.find({});

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Units');

            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 10 },
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Short Name', key: 'shortName', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];
            units.forEach((unit, index) => {
                worksheet.addRow({
                    sno: index + 1,
                    name: unit.name,
                    shortName: unit.shortName,
                    status: unit.status,
                    createdAt: unit.createdAt ? new Date(unit.createdAt).toLocaleDateString() : '-'
                });
            });

            worksheet.autoFilter = { from: "A1", to: "E1" };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=units.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=units.pdf');

            doc.pipe(res);

            // Title
            doc.fontSize(20).text('Units List', { align: 'center' });
            doc.moveDown();

            // Table constants
            const tableTop = 100;
            const itemHeight = 30;
            const col1 = 30;
            const col2 = 80;
            const col3 = 230;
            const col4 = 380;
            const col5 = 460;

            let y = tableTop;

            const drawHeader = (yPos) => {
                doc.fontSize(10).font('Helvetica-Bold');
                doc.fillColor('black');
                doc.text('S.No', col1, yPos);
                doc.text('Name', col2, yPos);
                doc.text('Short Name', col3, yPos);
                doc.text('Status', col4, yPos);
                doc.text('Created At', col5, yPos);

                // Header Line
                doc.moveTo(30, yPos + 15).lineTo(570, yPos + 15).stroke();
                doc.font('Helvetica');
            };

            drawHeader(y);
            y += 25;

            units.forEach((unit, index) => {
                if (y + itemHeight > 750) {
                    doc.addPage();
                    y = 50;
                    drawHeader(y);
                    y += 25;
                }

                doc.fontSize(10).fillColor('black');
                doc.text(`${index + 1}`, col1, y);
                doc.text(unit.name || '-', col2, y, { width: 140, ellipsis: true });
                doc.text(unit.shortName || '-', col3, y, { width: 140, ellipsis: true });

                // Status Color Logic
                if (unit.status === 'Active') {
                    doc.fillColor('green').text(unit.status, col4, y);
                } else {
                    doc.fillColor('red').text(unit.status || '-', col4, y);
                }

                doc.fillColor('black');
                const dateStr = unit.createdAt ? new Date(unit.createdAt).toLocaleDateString() : '-';
                doc.text(dateStr, col5, y);

                y += itemHeight;
                // Row Line
                doc.moveTo(30, y - 10).lineTo(570, y - 10).strokeColor('#eeeeee').stroke().strokeColor('#000000');
            });

            doc.end();
        } else {
            res.status(400).json({
                message: "Invalid format. Use 'xlsx' or 'pdf'.",
                status: false
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Get all units GET /api/units
export const getUnits = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        // If limit is 0, fetch all records (common pattern in this project based on history)
        if (parseInt(limit) === 0) {
            const units = await Unit.find(query).sort({ createdAt: -1 });
            return res.status(200).json({
                message: "Units Retrieved Successfully",
                status: true,
                data: units.map(u => ({
                    id: u._id,
                    name: u.name,
                    shortName: u.shortName,
                    status: u.status,
                    createdAt: u.createdAt,
                    updatedAt: u.updatedAt
                }))
            });
        }

        const units = await Unit.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Unit.countDocuments(query);

        res.status(200).json({
            message: "Units Retrieved Successfully",
            status: true,
            data: units.map(u => ({
                id: u._id,
                name: u.name,
                shortName: u.shortName,
                status: u.status,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt
            })),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};
