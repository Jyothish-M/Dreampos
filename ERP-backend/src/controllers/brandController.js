
import Brand from "../models/Brand.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { deleteBrandImage } from "../middleware/uploadMiddleware.js";

// Get single brand GET /api/brand/:id
export const getBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                message: "Brand not found",
                status: false,
            });
        }

        res.status(200).json({
            message: "Brand Retrieved Successfully",
            status: true,
            data: {
                id: brand._id,
                name: brand.name,
                slug: brand.slug,
                status: brand.status,
                image: brand.image,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Create brand POST /api/brand
export const createBrand = async (req, res) => {
    try {
        const { name, slug, status } = req.body;

        // Check if brand exists
        const brandExists = await Brand.findOne({ slug });
        if (brandExists) {
            return res.status(400).json({
                message: "Brand already exists",
                status: false,
            });
        }

        const brand = await Brand.create({
            name,
            slug,
            status,
            image: req.file ? req.file.filename : ""
        });

        res.status(201).json({
            message: "Brand Created Successfully",
            status: true,
            data: {
                id: brand._id,
                name: brand.name,
                slug: brand.slug,
                status: brand.status,
                image: brand.image,
                createdAt: brand.createdAt
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Update brand PUT /api/brand/:id
export const updateBrand = async (req, res) => {
    try {
        const { name, slug, status } = req.body;
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                message: "Brand not found",
                status: false,
            });
        }

        brand.name = name || brand.name;
        brand.slug = slug || brand.slug;
        brand.status = status || brand.status;

        if (req.file) {
            if (brand.image) {
                deleteBrandImage(brand.image);
            }
            brand.image = req.file.filename;
        }

        const updatedBrand = await brand.save();

        res.status(200).json({
            message: "Brand Updated Successfully",
            status: true,
            data: {
                id: updatedBrand._id,
                image: updatedBrand.image,
                updatedAt: updatedBrand.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Delete brand DELETE /api/brand/:id
export const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                message: "Brand not found",
                status: false,
            });
        }

        const id = brand._id;
        if (brand.image) {
            deleteBrandImage(brand.image);
        }
        await brand.deleteOne();

        res.status(200).json({
            message: "Brand Deleted Successfully",
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

// Bulk Delete brands POST /api/brand/bulk-delete
export const bulkDeleteBrands = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of IDs to delete",
                status: false
            });
        }

        const result = await Brand.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: "Brands Deleted Successfully",
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

// Bulk Update Status brands POST /api/brand/bulk-update
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

        const result = await Brand.updateMany(
            { _id: { $in: ids } },
            { $set: { status: status } }
        );

        res.status(200).json({
            message: "Brands Updated Successfully",
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

// Export brands GET /api/brand/export
export const exportBrands = async (req, res) => {
    try {
        const { format } = req.query;
        const brands = await Brand.find({});

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Brands');

            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 10 },
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Slug', key: 'slug', width: 25 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];
            brands.forEach((brand, index) => {
                worksheet.addRow({
                    sno: index + 1,
                    name: brand.name,
                    slug: brand.slug,
                    status: brand.status,
                    createdAt: brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : '-'
                });
            });

            worksheet.autoFilter = { from: "A1", to: "E1" };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=brands.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=brands.pdf');

            doc.pipe(res);

            // Title
            doc.fontSize(20).text('Brands List', { align: 'center' });
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
                doc.text('Slug', col3, yPos);
                doc.text('Status', col4, yPos);
                doc.text('Created At', col5, yPos);

                // Header Line
                doc.moveTo(30, yPos + 15).lineTo(570, yPos + 15).stroke();
                doc.font('Helvetica');
            };

            drawHeader(y);
            y += 25;

            brands.forEach((brand, index) => {
                if (y + itemHeight > 750) {
                    doc.addPage();
                    y = 50;
                    drawHeader(y);
                    y += 25;
                }

                doc.fontSize(10).fillColor('black');
                doc.text(`${index + 1}`, col1, y);
                doc.text(brand.name || '-', col2, y, { width: 140, ellipsis: true });
                doc.text(brand.slug || '-', col3, y, { width: 140, ellipsis: true });

                // Status Color Logic
                if (brand.status === 'Active') {
                    doc.fillColor('green').text(brand.status, col4, y);
                } else {
                    doc.fillColor('red').text(brand.status || '-', col4, y);
                }

                doc.fillColor('black');
                const dateStr = brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : '-';
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

// Get all brands (Added for completeness, though not explicitly in the Get One/Create list, usually needed)
export const getBrands = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const brands = await Brand.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Brand.countDocuments(query);

        res.status(200).json({
            message: "Brands Retrieved Successfully",
            status: true,
            data: brands.map(b => ({
                id: b._id,
                name: b.name,
                slug: b.slug,
                status: b.status,
                image: b.image,
                createdAt: b.createdAt
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
