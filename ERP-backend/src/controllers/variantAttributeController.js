import VariantAttribute from "../models/VariantAttribute.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// Get single variant attribute GET /api/variantattributes/:id
export const getVariantAttribute = async (req, res) => {
    try {
        const variantAttribute = await VariantAttribute.findById(req.params.id);

        if (!variantAttribute) {
            return res.status(404).json({
                message: "Variant attribute not found",
                status: false,
            });
        }

        res.status(200).json({
            message: "Variant attribute Retrieved Successfully",
            status: true,
            data: {
                id: variantAttribute._id,
                variant: variantAttribute.variant,
                values: variantAttribute.values,
                status: variantAttribute.status,
                createdAt: variantAttribute.createdAt.toISOString().split('T')[0]
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Create variant attribute POST /api/variantattributes
export const createVariantAttribute = async (req, res) => {
    try {
        const { variant, values, status } = req.body;

        // Check if variant attribute exists
        const exists = await VariantAttribute.findOne({ variant });

        if (exists) {
            return res.status(400).json({
                message: "Variant attribute with this name already exists",
                status: false,
            });
        }

        const variantAttribute = await VariantAttribute.create({
            variant,
            values,
            status
        });

        res.status(201).json({
            message: "Variant attribute Created Successfully",
            status: true,
            data: {
                id: variantAttribute._id,
                variant: variantAttribute.variant,
                values: variantAttribute.values,
                status: variantAttribute.status,
                createdAt: variantAttribute.createdAt.toISOString().split('T')[0]
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Update variant attribute PUT /api/variantattributes/:id
export const updateVariantAttribute = async (req, res) => {
    try {
        const { variant, values, status } = req.body;
        const variantAttribute = await VariantAttribute.findById(req.params.id);

        if (!variantAttribute) {
            return res.status(404).json({
                message: "Variant attribute not found",
                status: false,
            });
        }

        if (variant) {
            const existing = await VariantAttribute.findOne({
                variant,
                _id: { $ne: req.params.id }
            });

            if (existing) {
                return res.status(400).json({
                    message: "Variant attribute with this name already exists",
                    status: false,
                });
            }
            variantAttribute.variant = variant;
        }

        if (values !== undefined) {
            variantAttribute.values = values;
        }

        if (status !== undefined) {
            variantAttribute.status = status;
        }

        await variantAttribute.save();

        res.status(200).json({
            message: "Variant attribute Updated Successfully",
            status: true,
            data: {
                id: variantAttribute._id,
                variant: variantAttribute.variant,
                values: variantAttribute.values,
                status: variantAttribute.status,
                createdAt: variantAttribute.createdAt.toISOString().split('T')[0]
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Delete variant attribute DELETE /api/variantattributes/:id
export const deleteVariantAttribute = async (req, res) => {
    try {
        const variantAttribute = await VariantAttribute.findById(req.params.id);

        if (!variantAttribute) {
            return res.status(404).json({
                message: "Variant attribute not found",
                status: false,
            });
        }

        await variantAttribute.deleteOne();

        res.status(200).json({
            message: "Variant attribute Deleted Successfully",
            status: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Bulk Delete variant attributes DELETE /api/variantattributes
export const bulkDeleteVariantAttributes = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of variant attribute IDs",
                status: false
            });
        }

        await VariantAttribute.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: "Variant attributes Deleted Successfully",
            status: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

// Get all variant attributes GET /api/variantattributes
export const getVariantAttributes = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { variant: { $regex: search, $options: "i" } },
                    { values: { $regex: search, $options: "i" } }
                ]
            };
        }

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;

        const totalRecords = await VariantAttribute.countDocuments(query);
        
        const variantAttributes = await VariantAttribute.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: "Variant attributes Retrieved Successfully",
            status: true,
            dataFound: variantAttributes.length > 0,
            data: variantAttributes.map(item => ({
                id: item._id,
                variant: item.variant,
                values: item.values,
                status: item.status,
                createdAt: item.createdAt.toISOString().split('T')[0],
                createdon: item.createdAt.toISOString().split('T')[0] // For frontend compatibility
            })),
            pagination: {
                total: totalRecords,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(totalRecords / limitNum),
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Export variant attributes GET /api/variantattributes/export
export const exportVariantAttributes = async (req, res) => {
    try {
        const { format } = req.query;
        const items = await VariantAttribute.find({});

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Variant Attributes');

            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 10 },
                { header: 'Variant', key: 'variant', width: 25 },
                { header: 'Values', key: 'values', width: 40 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];

            items.forEach((item, index) => {
                worksheet.addRow({
                    sno: index + 1,
                    variant: item.variant,
                    values: item.values,
                    status: item.status,
                    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'
                });
            });

            worksheet.autoFilter = { from: "A1", to: "E1" };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=variant-attributes.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=variant-attributes.pdf');

            doc.pipe(res);

            doc.fontSize(20).text('Variant Attributes List', { align: 'center' });
            doc.moveDown();

            const tableTop = 100;
            const itemHeight = 30;
            const col1 = 30, col2 = 80, col3 = 220, col4 = 430, col5 = 510;
            let y = tableTop;

            const drawHeader = (yPos) => {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
                doc.text('S.No', col1, yPos);
                doc.text('Variant', col2, yPos);
                doc.text('Values', col3, yPos);
                doc.text('Status', col4, yPos);
                doc.text('Created At', col5, yPos);
                doc.moveTo(30, yPos + 15).lineTo(570, yPos + 15).stroke();
                doc.font('Helvetica');
            };

            drawHeader(y);
            y += 25;

            items.forEach((item, index) => {
                if (y + itemHeight > 750) {
                    doc.addPage();
                    y = 50;
                    drawHeader(y);
                    y += 25;
                }

                doc.fontSize(10).fillColor('black');
                doc.text(`${index + 1}`, col1, y);
                doc.text(item.variant || '-', col2, y, { width: 130, ellipsis: true });
                doc.text(item.values || '-', col3, y, { width: 200, ellipsis: true });

                if (item.status === 'Active') {
                    doc.fillColor('green').text(item.status, col4, y);
                } else {
                    doc.fillColor('red').text(item.status || '-', col4, y);
                }

                doc.fillColor('black');
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-';
                doc.text(dateStr, col5, y);

                y += itemHeight;
                doc.moveTo(30, y - 10).lineTo(570, y - 10).strokeColor('#eeeeee').stroke().strokeColor('#000000');
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
