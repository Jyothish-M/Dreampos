
import Category from "../models/Category.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// Get single categoryGET /api/categories/:id

export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                status: false,
            });
        }

        res.status(200).json({
            message: "Category Retrieved Successfully",
            status: true,
            data: {
                id: category._id,
                name: category.name,
                slug: category.slug,
                status: category.status,
                createdAt: category.createdAt
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

//Create category POST /api/categories

export const createCategory = async (req, res) => {
    try {
        const { name, slug, status } = req.body;

        // Check if category exists
        const categoryExists = await Category.findOne({ slug });
        if (categoryExists) {
            return res.status(400).json({
                message: "Category already exists",
                status: false,
            });
        }

        const category = await Category.create({
            name,
            slug,
            status
        });

        res.status(201).json({
            message: "Category Created Successfully",
            status: true,
            data: {
                id: category._id,
                name: category.name,
                slug: category.slug,
                status: category.status
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

//Update category PUT /api/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const { name, slug, status } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                status: false,
            });
        }

        category.name = name || category.name;
        category.slug = slug || category.slug;
        category.status = status || category.status;

        const updatedCategory = await category.save();

        res.status(200).json({
            message: "Category Updated Successfully",
            status: true,
            data: {
                id: updatedCategory._id,
                name: updatedCategory.name,
                slug: updatedCategory.slug,
                status: updatedCategory.status
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

//Delete category DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                status: false,
            });
        }

        await category.deleteOne();

        res.status(200).json({
            message: "Category Deleted Successfully",
            status: true,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};

// Delete categories POST /api/categories/bulk-delete
export const bulkDeleteCategories = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of IDs to delete",
                status: false
            });
        }

        const result = await Category.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: "Categories Deleted Successfully",
            status: true,
            data: {
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

// Bulk Update Status categories /api/categories/bulk-update
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

        const result = await Category.updateMany(
            { _id: { $in: ids } },
            { $set: { status: status } }
        );

        res.status(200).json({
            message: "Categories Updated Successfully",
            status: true,
            data: {
                updatedCount: result.modifiedCount
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};


// Export categories GET /api/categories/export
export const exportCategories = async (req, res) => {
    try {
        const { format } = req.query;
        const categories = await Category.find({});

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Categories');

            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 10 },
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Slug', key: 'slug', width: 25 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];

            categories.forEach((category, index) => {
                worksheet.addRow({
                    sno: index + 1,
                    name: category.name,
                    slug: category.slug,
                    status: category.status,
                    createdAt: category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-'
                });
            });

            worksheet.autoFilter = { from: "A1", to: "E1" };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=categories.pdf');

            doc.pipe(res);

            // Title
            doc.fontSize(20).text('Categories List', { align: 'center' });
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

            categories.forEach((category, index) => {
                if (y + itemHeight > 750) {
                    doc.addPage();
                    y = 50;
                    drawHeader(y);
                    y += 25;
                }

                doc.fontSize(10).fillColor('black');
                doc.text(`${index + 1}`, col1, y);
                doc.text(category.name || '-', col2, y, { width: 140, ellipsis: true });
                doc.text(category.slug || '-', col3, y, { width: 140, ellipsis: true });

                // Status Color Logic
                if (category.status === 'Active') {
                    doc.fillColor('green').text(category.status, col4, y);
                } else {
                    doc.fillColor('red').text(category.status || '-', col4, y);
                }

                doc.fillColor('black');
                const dateStr = category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-';
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

// Get all categories GET /api/categories
export const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const categories = await Category.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Category.countDocuments(query);

        res.status(200).json({
            message: "Categories Retrieved Successfully",
            status: true,
            data: categories.map(cat => ({
                id: cat._id,
                name: cat.name,
                slug: cat.slug,
                status: cat.status,
                createdAt: cat.createdAt
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
