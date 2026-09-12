import Subcategory from "../models/Subcategory.js";
import Category from "../models/Category.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

//GET ALL BY PARENT CATEGORY  GET /api/categories/:id/subcategories
export const getSubcategoriesByCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found", status: false });
        }

        const subcategories = await Subcategory.find({ categoryId: id }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Sub Categories Retrieved Successfully",
            status: true,
            data: subcategories.map(sub => ({
                id: sub._id,
                name: sub.name,
                categoryId: sub.categoryId,
                status: sub.status
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//GET ALL  GET /api/subcategories
export const getSubcategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, categoryId } = req.query;

        const query = {};
        if (search) query.name = { $regex: search, $options: "i" };
        if (categoryId) query.categoryId = categoryId;

        const total = await Subcategory.countDocuments(query);

        let subcategoriesQuery = Subcategory.find(query)
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        if (parseInt(limit) !== 0) {
            subcategoriesQuery = subcategoriesQuery
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit));
        }

        const subcategories = await subcategoriesQuery.exec();

        res.status(200).json({
            message: "Sub Categories Retrieved Successfully",
            status: true,
            data: subcategories.map(sub => ({
                id: sub._id,
                name: sub.name,
                slug: sub.slug,
                categoryId: sub.categoryId?._id,
                categoryName: sub.categoryId?.name,
                status: sub.status,
                createdAt: sub.createdAt,
                updatedAt: sub.updatedAt
            })),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: parseInt(limit) === 0 ? 1 : Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET ONE  GET /api/subcategories/:id 
export const getSubcategory = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.id).populate("categoryId", "name");

        if (!subcategory) {
            return res.status(404).json({ message: "Sub Category not found", status: false });
        }

        res.status(200).json({
            message: "Sub Category Retrieved Successfully",
            status: true,
            data: {
                id: subcategory._id,
                name: subcategory.name,
                slug: subcategory.slug,
                categoryId: subcategory.categoryId?._id,
                categoryName: subcategory.categoryId?.name,
                status: subcategory.status,
                createdAt: subcategory.createdAt,
                updatedAt: subcategory.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//CREATE  POST /api/subcategories 
export const createSubcategory = async (req, res) => {
    try {
        const { categoryId, name, slug, status } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Parent category not found", status: false });
        }

        const existing = await Subcategory.findOne({ slug });
        if (existing) {
            return res.status(400).json({ message: "Subcategory with this slug already exists", status: false });
        }

        const subcategory = await Subcategory.create({ name, slug, categoryId, status });

        res.status(201).json({
            message: "Sub Category Created Successfully",
            status: true,
            data: {
                id: subcategory._id,
                name: subcategory.name,
                categoryId: subcategory.categoryId,
                status: subcategory.status,
                createdAt: subcategory.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//UPDATE  PUT /api/subcategories/:id
export const updateSubcategory = async (req, res) => {
    try {
        const { categoryId, name, slug, status } = req.body;

        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ message: "Sub Category not found", status: false });
        }

        if (categoryId && categoryId.toString() !== subcategory.categoryId.toString()) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Parent category not found", status: false });
            }
            subcategory.categoryId = categoryId;
        }

        if (slug && slug !== subcategory.slug) {
            const existing = await Subcategory.findOne({ slug, _id: { $ne: req.params.id } });
            if (existing) {
                return res.status(400).json({ message: "Slug already in use by another subcategory", status: false });
            }
            subcategory.slug = slug;
        }

        if (name) subcategory.name = name;
        if (status) subcategory.status = status;

        const updated = await subcategory.save();

        res.status(200).json({
            message: "Sub Category Updated Successfully",
            status: true,
            data: {
                id: updated._id,
                updatedAt: updated.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//DELETE  DELETE /api/subcategories/:id
export const deleteSubcategory = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ message: "Sub Category not found", status: false });
        }

        await subcategory.deleteOne();

        res.status(200).json({
            message: "Sub Categories Deleted Successfully",
            status: true,
            data: { requested: 1, deletedCount: 1 }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//BULK DELETE  POST /api/subcategories/bulk-delete
export const bulkDeleteSubcategories = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of IDs to delete", status: false });
        }

        const result = await Subcategory.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: "Categories Deleted Successfully",
            status: true,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//BULK UPDATE STATUS  POST /api/subcategories/bulk-update
export const bulkUpdateSubcategoryStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of IDs to update", status: false });
        }
        if (!status) {
            return res.status(400).json({ message: "Please provide a status to update", status: false });
        }

        const result = await Subcategory.updateMany(
            { _id: { $in: ids } },
            { $set: { status } }
        );

        res.status(200).json({
            message: "Sub Categories Updated Successfully",
            status: true,
            data: {
                requested: ids.length,
                updatedCount: result.modifiedCount,
                updatedStatus: status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

//EXPORT  GET /api/subcategories/export?format=xlsx|pdf
export const exportSubcategories = async (req, res) => {
    try {
        const { format } = req.query;

        const subcategories = await Subcategory.find({})
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        if (format === "xlsx") {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Subcategories");

            worksheet.columns = [
        
                { header: "S.No", key: "sno", width: 10 },
                { header: "Name", key: "name", width: 25 },
                { header: "Slug", key: "slug", width: 25 },
                { header: "Category", key: "categoryName", width: 25 },
                { header: "Status", key: "status", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 }
            ];

            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
            headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

            subcategories.forEach((sub, index) => {
                worksheet.addRow({
                    sno: index + 1,
                    name: sub.name,
                    slug: sub.slug,
                    categoryName: sub.categoryId?.name || "-",
                    status: sub.status,
                    createdAt: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "-"
                });
            });

            worksheet.autoFilter = { from: "A1", to: "F1" };

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=subcategories.xlsx");
            await workbook.xlsx.write(res);
            res.end();

        } else if (format === "pdf") {
            const doc = new PDFDocument({ margin: 30, size: "A4" });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=subcategories.pdf");
            doc.pipe(res);

            doc.fontSize(20).font("Helvetica-Bold").text("Subcategories List", { align: "center" });
            doc.fontSize(10).font("Helvetica").fillColor("#666")
                .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" });
            doc.moveDown();

            const col1 = 30, col2 = 65, col3 = 205, col4 = 340, col5 = 445, col6 = 510;
            const itemHeight = 28;
            let y = 130;

            const drawHeader = (yPos) => {
                doc.rect(25, yPos - 5, 555, 20).fill("#4472C4");
                doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFF");
                doc.text("S.No", col1, yPos);
                doc.text("Name", col2, yPos);
                doc.text("Slug", col3, yPos);
                doc.text("Category", col4, yPos);
                doc.text("Status", col5, yPos);
                doc.text("Created At", col6, yPos);
                doc.font("Helvetica").fillColor("#000");
            };

            drawHeader(y);
            y += 22;

            subcategories.forEach((sub, index) => {
                if (y + itemHeight > 780) {
                    doc.addPage();
                    y = 50;
                    drawHeader(y);
                    y += 22;
                }

                if (index % 2 === 0) {
                    doc.rect(25, y - 5, 555, itemHeight - 2).fill("#F5F5F5");
                }

                doc.fontSize(9).fillColor("#000");
                doc.text(`${index + 1}`, col1, y);
                doc.text(sub.name || "-", col2, y, { width: 130, ellipsis: true });
                doc.text(sub.slug || "-", col3, y, { width: 125, ellipsis: true });
                doc.text(sub.categoryId?.name || "-", col4, y, { width: 95, ellipsis: true });

                const statusColor = sub.status === "Active" ? "#2e7d32" : "#c62828";
                doc.fillColor(statusColor).text(sub.status || "-", col5, y, { width: 55 });

                doc.fillColor("#000").text(
                    sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "-",
                    col6, y
                );

                doc.moveTo(25, y + itemHeight - 4).lineTo(580, y + itemHeight - 4)
                    .strokeColor("#E0E0E0").stroke().strokeColor("#000");

                y += itemHeight;
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
