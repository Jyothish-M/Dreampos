import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Export entities to Excel
export const exportToExcel = async (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    worksheet.columns = [
        { header: "S.No", key: "sno", width: 8 },
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 15 },
        { header: "State", key: "state", width: 15 },
        { header: "Country", key: "country", width: 15 },
        { header: "Status", key: "status", width: 10 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }
    };

    data.forEach((item, index) => {
        const name = item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim();
        worksheet.addRow({
            sno: index + 1,
            name: name || "N/A",
            email: item.email,
            phone: item.phone || "",
            address: item.address || "",
            city: item.city || "",
            state: item.state || "",
            country: item.country || "",
            status: item.status
        });
    });

    return await workbook.xlsx.writeBuffer();
};

// Export entities to PDF
export const exportToPDF = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                layout: "landscape",
                margin: 50,
                bufferPages: true
            });

            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            doc.fontSize(20).font("Helvetica-Bold").text("Export Report", { align: "center" });
            doc.moveDown();
            doc.fontSize(10).font("Helvetica").text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" });
            doc.moveDown();

            const tableTop = 150;
            const itemHeight = 25;
            let currentY = tableTop;

            const cols = { name: 50, email: 220, phone: 400, city: 520, status: 620, country: 700 };

            doc.fontSize(10).font("Helvetica-Bold");
            doc.rect(40, currentY - 5, 760, 20).fillAndStroke("#4472C4", "#000");
            doc.fillColor("#FFF");
            doc.text("Name", cols.name, currentY);
            doc.text("Email", cols.email, currentY);
            doc.text("Phone", cols.phone, currentY);
            doc.text("City", cols.city, currentY);
            doc.text("Status", cols.status, currentY);
            doc.text("Country", cols.country, currentY);

            currentY += itemHeight;
            doc.fillColor("#000").font("Helvetica");

            data.forEach((item, index) => {
                if (currentY > 500) {
                    doc.addPage({ size: "A4", layout: "landscape", margin: 50 });
                    currentY = 50;
                }

                if (index % 2 === 0) {
                    doc.rect(40, currentY - 5, 760, 20).fillAndStroke("#F5F5F5", "#EEE");
                } else {
                    doc.rect(40, currentY - 5, 760, 20).stroke("#EEE");
                }

                doc.fillColor("#000").fontSize(9);
                const name = (item.name || `${item.firstName || ""} ${item.lastName || ""}`).trim();
                doc.text(name || "N/A", cols.name, currentY, { width: 150, ellipsis: true });
                doc.text(item.email || "N/A", cols.email, currentY, { width: 120, ellipsis: true });
                doc.text(item.phone || "N/A", cols.phone, currentY, { width: 90, ellipsis: true });
                doc.text(item.city || "N/A", cols.city, currentY, { width: 90, ellipsis: true });
                doc.text(item.status || "N/A", cols.status, currentY, { width: 60 });
                doc.text(item.country || "N/A", cols.country, currentY, { width: 100, ellipsis: true });

                currentY += itemHeight;
            });

            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(`Page ${i + 1} of ${pages.count}`, 0, doc.page.height - 40, { align: "center", width: doc.page.width });
            }

            doc.end();
        } catch (error) { reject(error); }
    });
};

// Export individual profile details
const drawDetailRow = (doc, label, value, currentY) => {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#666").text(label, 100, currentY);
    doc.font("Helvetica").fillColor("#333").text(value || "N/A", 250, currentY);
    return currentY + 25;
};

const exportDetailToPDF = (title, subtitle, codeLabel, entity) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
            const chunks = [];
            doc.on("data", (c) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            doc.fontSize(24).font("Helvetica-Bold").fillColor("#fe9f43").text("DreamsPOS ERP", { align: "center" });
            doc.fontSize(10).font("Helvetica").fillColor("#666").text(subtitle, { align: "center" });
            doc.moveDown(2);

            doc.fontSize(10).font("Helvetica-Bold").fillColor("#333");
            doc.text(`Report Date: ${new Date().toLocaleDateString()}`, { align: "right" });
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#eee").stroke();
            doc.moveDown(2);

            doc.fontSize(16).font("Helvetica-Bold").fillColor("#333").text("General Information");
            doc.moveDown();

            let currentY = doc.y;
            const name = (entity.name || `${entity.firstName || ""} ${entity.lastName || ""}`).trim();
            currentY = drawDetailRow(doc, "Name:", name || "N/A", currentY);
            currentY = drawDetailRow(doc, "Email:", entity.email, currentY);
            currentY = drawDetailRow(doc, "Phone:", entity.phone, currentY);
            currentY = drawDetailRow(doc, "Status:", entity.status, currentY);
            if (entity.gstin) currentY = drawDetailRow(doc, "GSTIN:", entity.gstin, currentY);

            doc.moveDown();
            currentY = doc.y + 10;
            doc.fontSize(16).font("Helvetica-Bold").fillColor("#333").text("Location Details");
            doc.moveDown();
            currentY = doc.y;
            currentY = drawDetailRow(doc, "Address:", entity.address, currentY);
            currentY = drawDetailRow(doc, "City:", entity.city, currentY);
            currentY = drawDetailRow(doc, "State:", entity.state, currentY);
            currentY = drawDetailRow(doc, "Country:", entity.country, currentY);
            if (entity.postalCode) currentY = drawDetailRow(doc, "Postal Code:", entity.postalCode, currentY);

            doc.end();
        } catch (e) { reject(e); }
    });
};

export const exportCustomerDetailsToPDF = (entity) => exportDetailToPDF("DreamsPOS ERP", "Customer Profile Report", "Customer Code", entity);
export const exportSupplierDetailsToPDF = (entity) => exportDetailToPDF("DreamsPOS ERP", "Supplier Profile Report", "Supplier Code", entity);
export const exportStoreDetailsToPDF = (entity) => exportDetailToPDF("DreamsPOS ERP", "Store Profile Report", "Store Code", entity);
export const exportWarehouseDetailsToPDF = (entity) => exportDetailToPDF("DreamsPOS ERP", "Warehouse Profile Report", "Warehouse Code", entity);
