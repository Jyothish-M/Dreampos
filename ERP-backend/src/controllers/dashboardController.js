import Invoice from "../models/Invoice.js";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Quotation from "../models/Quotation.js";
import Currency from "../models/Currency.js";
import Category from "../models/Category.js";

const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

export const getDashboardSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let timeMatch = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            timeMatch = {
                createdAt: {
                    $gte: start,
                    $lte: end
                }
            };
        }

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });

        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;

        const usdToInrMultiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const convertToINR = (field) => ({
            $cond: [
                { $eq: ["$invoiceType", "International"] },
                { $multiply: [field, usdToInrMultiplier] },
                field
            ]
        });

        // 1. Totals (Filtered by time range if provided)
        const totalSalesData = await Invoice.aggregate([
            { $match: timeMatch },
            { $group: { _id: null, total: { $sum: convertToINR("$grandTotal") } } }
        ]);
        const totalPurchasesData = await Purchase.aggregate([
            { $match: timeMatch },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);
        const totalInvoicesDueData = await Invoice.aggregate([
            { $match: { ...timeMatch, type: { $ne: "Sale" } } },
            { $group: { _id: null, total: { $sum: convertToINR({ $subtract: ["$grandTotal", "$paidAmount"] }) } } }
        ]);

        // 2. Current Month Totals
        const monthSalesData = await Invoice.aggregate([
            { $match: { createdAt: { $gte: currentMonthStart } } },
            { $group: { _id: null, total: { $sum: convertToINR("$grandTotal") } } }
        ]);
        const monthPurchasesData = await Purchase.aggregate([
            { $match: { createdAt: { $gte: currentMonthStart } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        // 3. Last Month Totals (for percentages)
        const lastMonthSalesData = await Invoice.aggregate([
            { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: convertToINR("$grandTotal") } } }
        ]);
        const lastMonthPurchasesData = await Purchase.aggregate([
            { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        // 4. Counts & Trends
        const customerCount = await Customer.countDocuments(timeMatch);
        const lastMonthCustomerCount = await Customer.countDocuments({ createdAt: { $lte: lastMonthEnd } });
        const customerChange = getPercentageChange(customerCount, lastMonthCustomerCount);

        const productCount = await Product.countDocuments({ status: "Available", ...timeMatch });
        const lastMonthProductCount = await Product.countDocuments({ createdAt: { $lte: lastMonthEnd } });
        const productChange = getPercentageChange(productCount, lastMonthProductCount);

        const totalOrders = await Invoice.countDocuments(timeMatch); // All transactions
        const invoiceCount = await Invoice.countDocuments({ type: { $ne: "Sale" }, ...timeMatch });
        const lastMonthInvoiceCount = await Invoice.countDocuments({ type: { $ne: "Sale" }, createdAt: { $lte: lastMonthEnd } });
        const invoiceChange = getPercentageChange(invoiceCount, lastMonthInvoiceCount);

        const saleCount = await Invoice.countDocuments({ type: "Sale", ...timeMatch });
        const quotationCount = await Quotation.countDocuments(timeMatch);
        const lastMonthQuotationCount = await Quotation.countDocuments({ createdAt: { $lte: lastMonthEnd } });
        const quotationChange = getPercentageChange(quotationCount, lastMonthQuotationCount);

        const categoryCount = await Category.countDocuments({ status: "Active", ...timeMatch });
        
        // 4b. Stock Stats
        const lowStockCount = await Product.countDocuments({
            $expr: {
                $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", { $ifNull: ["$quantityAlert", 10] }] }
                ]
            },
            status: "Available"
        });
        const outOfStockCount = await Product.countDocuments({ quantity: { $lte: 0 } });
        
        const stockValueData = await Product.aggregate([
            { $group: { _id: null, totalValue: { $sum: { $multiply: ["$priceAfterTax", "$quantity"] } } } }
        ]);
        const totalStockValue = stockValueData[0]?.totalValue || 0;

        // 4c. Expired Products
        const expiredCount = await Product.countDocuments({ expiryDate: { $lt: now } });
        const nearExpiryCount = await Product.countDocuments({ 
            expiryDate: { 
                $gte: now, 
                $lte: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
            } 
        });

        const expiredProductsList = await Product.find({ expiryDate: { $lt: now } })
            .limit(5)
            .select("product sku quantity images manufacturedDate expiryDate");

        // 4d. Unique Suppliers (from Purchase records)
        const suppliers = await Purchase.distinct("supplierName");
        const supplierCount = suppliers.length;

        // 4c. Customer Loyalty (First Time vs Returning)
        const customerLoyalty = await Invoice.aggregate([
            { $group: { _id: "$customerId", count: { $sum: 1 } } }
        ]);
        const firstTimeCount = customerLoyalty.filter(c => c.count === 1).length;
        const returningCount = customerLoyalty.filter(c => c.count > 1).length;

        // 5. Low Stock Products
        const lowStockProducts = await Product.find({
            $expr: {
                $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", { $ifNull: ["$quantityAlert", 10] }] }
                ]
            }
        })
            .limit(5)
            .select("product sku quantity images itemCode");

        // 6. Top Selling Products
        const topSellingProducts = await Invoice.aggregate([
            { $match: timeMatch },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalQty: { $sum: "$items.quantity" },
                    totalAmount: { $sum: convertToINR("$items.amount") },
                    productName: { $first: "$items.productName" }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQty: 1,
                    totalAmount: 1,
                    productName: 1,
                    images: { $arrayElemAt: ["$productDetails.images", 0] }
                }
            }
        ]);

        // 7. Recent Transactions
        const rawRecentSales = await Invoice.find(timeMatch).sort({ createdAt: -1 }).limit(10).populate("customerId", "firstName lastName").populate("items.productId", "images");
        const rawRecentPurchases = await Purchase.find(timeMatch).sort({ createdAt: -1 }).limit(10);
        const rawRecentQuotations = await Quotation.find(timeMatch).sort({ createdAt: -1 }).limit(10).populate("customerId", "firstName lastName");
        const rawRecentInvoices = await Invoice.find({ ...timeMatch, type: { $ne: "Sale" } }).sort({ createdAt: -1 }).limit(10).populate("customerId", "firstName lastName avatar").populate("items.productId", "images");

        const recentSales = rawRecentSales.map(inv => {
            const doc = inv.toObject();
            if (doc.invoiceType === "International") {
                doc.grandTotal = doc.grandTotal * usdToInrMultiplier;
                doc.paidAmount = doc.paidAmount * usdToInrMultiplier;
            }
            return doc;
        });

        const recentPurchases = rawRecentPurchases.map(p => {
            const doc = p.toObject();
            doc.purchaseNo = doc.purchaseNumber;
            return doc;
        });

        const recentQuotations = rawRecentQuotations.map(q => {
            const doc = q.toObject();
            if (doc.quotationType === "International") {
                doc.grandTotal = doc.grandTotal * usdToInrMultiplier;
            }
            return doc;
        });

        const recentInvoices = rawRecentInvoices.map(inv => {
            const doc = inv.toObject();
            if (doc.invoiceType === "International") {
                doc.grandTotal = doc.grandTotal * usdToInrMultiplier;
            }
            return doc;
        });

        // 8. Top Customers
        const topCustomers = await Invoice.aggregate([
            { $match: timeMatch },
            { $group: { _id: "$customerId", totalSpend: { $sum: convertToINR("$grandTotal") }, orderCount: { $count: {} } } },
            { $sort: { totalSpend: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customerInfo"
                }
            },
            { $unwind: "$customerInfo" }
        ]);

        // 9. Category Distribution
        const categoryStats = await Invoice.aggregate([
            { $match: timeMatch },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.categoryId",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
                    salesCount: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: convertToINR("$items.amount") }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 3 }
        ]);

        // 10. Order Statistics 
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const heatmapMatch = (startDate && endDate) ? timeMatch : { createdAt: { $gte: thirtyDaysAgo } };

        const orderStatsAll = await Invoice.aggregate([
            { $match: heatmapMatch },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 11. Hourly Distribution FOR TODAY (for SalesDayChart)
        const startOfToday = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        startOfToday.setHours(0, 0, 0, 0);

        const dateMatch = (startDate && endDate) ? timeMatch : { createdAt: { $gte: startOfToday } };

        const todayInvoiceCount = await Invoice.countDocuments(dateMatch);

        const todayHourlyData = await Invoice.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: { hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } } },
                    total: { $sum: convertToINR("$grandTotal") }
                }
            }
        ]);
        const todayPurchaseHourlyData = await Purchase.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: { hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } } },
                    total: { $sum: "$grandTotal" }
                }
            }
        ]);

        const totalSales = totalSalesData[0]?.total || 0;
        const totalPurchases = totalPurchasesData[0]?.total || 0;
        const invoiceDue = totalInvoicesDueData[0]?.total || 0;
        const profit = totalSales - totalPurchases;

        const salesChange = getPercentageChange(monthSalesData[0]?.total || 0, lastMonthSalesData[0]?.total || 0);
        const purchaseChange = getPercentageChange(monthPurchasesData[0]?.total || 0, lastMonthPurchasesData[0]?.total || 0);

        // Map day number to short name
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        // Initialize heatmap data
        const heatmap = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map(h => ({
            name: `${h > 12 ? h - 12 : h} ${h < 12 || h === 24 ? 'am' : 'pm'}`,
            data: days.map(d => ({ x: d, y: 0 }))
        }));

        orderStatsAll.forEach(stat => {
            const dayName = days[stat._id.day - 1];
            const hour = stat._id.hour;
            const bucketIndex = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].findIndex(h => hour < h);
            if (bucketIndex !== -1) {
                const dayIndex = days.indexOf(dayName);
                heatmap[bucketIndex].data[dayIndex].y += stat.count;
            }
        });

        // Today hourly series (buckets of 2h to match chart)
        const todaySalesSeries = new Array(12).fill(0);
        const todayPurchaseSeries = new Array(12).fill(0);

        todayHourlyData.forEach(item => {
            const hour = item._id.hour;
            const bucketIndex = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].findIndex(h => hour < h);
            if (bucketIndex !== -1) todaySalesSeries[bucketIndex] += item.total;
        });
        todayPurchaseHourlyData.forEach(item => {
            const hour = item._id.hour;
            const bucketIndex = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].findIndex(h => hour < h);
            if (bucketIndex !== -1) todayPurchaseSeries[bucketIndex] += item.total;
        });

        res.json({
            status: true,
            data: {
                summary: {
                    totalSales: Math.round(totalSales),
                    totalPurchases: Math.round(totalPurchases),
                    invoiceDue: Math.round(invoiceDue),
                    totalInvoicesDue: Math.round(invoiceDue),
                    profit: Math.round(profit),
                    customerCount,
                    productCount,
                    categoryCount,
                    invoiceCount,
                    saleCount,
                    totalOrders,
                    todayInvoiceCount,
                    quotationCount,
                    supplierCount,
                    firstTimeCount,
                    returningCount,
                    expiredCount,
                    nearExpiryCount,
                    lowStockCount,
                    outOfStockCount,
                    totalStockValue,
                    totalSalesReturn: 0,
                    totalPurchaseReturn: 0,
                    totalExpenses: Math.round(totalPurchases),
                    totalPaymentReturns: 0,
                    salesChange,
                    purchaseChange,
                    customerChange,
                    productChange,
                    invoiceChange,
                    quotationChange,
                    profitChange: getPercentageChange(profit, (lastMonthSalesData[0]?.total || 0) - (lastMonthPurchasesData[0]?.total || 0))
                },
                lowStockProducts,
                expiredProducts: expiredProductsList,
                topSellingProducts,
                topCustomers,
                categoryStats,
                orderStats: heatmap,
                todayChart: {
                    sales: todaySalesSeries.map(s => Number((s / 1000).toFixed(2))),
                    purchases: todayPurchaseSeries.map(p => Number((p / 1000).toFixed(2)))
                },

                transactions: {
                    recentSales,
                    recentPurchases,
                    recentQuotations,
                    invoices: recentInvoices
                }
            }
        });
    } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getDashboardCharts = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        // Fetch USD and INR rates for chart conversion
        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });

        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;
        const multiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const salesByMonth = await Invoice.aggregate([
            { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    total: {
                        $sum: {
                            $cond: [
                                { $eq: ["$invoiceType", "International"] },
                                { $multiply: ["$grandTotal", multiplier] },
                                "$grandTotal"
                            ]
                        }
                    }
                }
            },
            { $sort: { "_id.month": 1 } }
        ]);

        const purchasesByMonth = await Purchase.aggregate([
            { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    total: { $sum: "$grandTotal" }
                }
            },
            { $sort: { "_id.month": 1 } }
        ]);

        // Format to 12 months array for ApexCharts
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const salesData = new Array(12).fill(0);
        const purchaseData = new Array(12).fill(0);

        let yearlySalesTotal = 0;
        let yearlyPurchaseTotal = 0;

        salesByMonth.forEach(item => {
            salesData[item._id.month - 1] = item.total;
            yearlySalesTotal += item.total;
        });
        purchasesByMonth.forEach(item => {
            purchaseData[item._id.month - 1] = item.total;
            yearlyPurchaseTotal += item.total;
        });

        res.status(200).json({
            status: true,
            data: {
                months,
                sales: salesData,
                purchases: purchaseData,
                yearlySalesTotal: Math.round(yearlySalesTotal),
                yearlyPurchaseTotal: Math.round(yearlyPurchaseTotal)
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getOrdersChart = async (req, res) => {
    try {
        const { period = "today" } = req.query;
        const now = new Date();

        // Fetch USD and INR rates for conversion
        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });
        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;
        const usdToInrMultiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const convertToINR = (field) => ({
            $cond: [
                { $eq: ["$invoiceType", "International"] },
                { $multiply: [field, usdToInrMultiplier] },
                field
            ]
        });

        const startOfToday = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        startOfToday.setHours(0, 0, 0, 0);

        let startDate, endDate;
        let groupBy = "hour";
        let categories = ["2 am", "4 am", "6 am", "8 am", "10 am", "12 am", "14 pm", "16 pm", "18 pm", "20 pm", "22 pm", "24 pm"];

        if (period === "today") {
            startDate = startOfToday;
            endDate = new Date(now);
        } else if (period === "yesterday") {
            startDate = new Date(startOfToday);
            startDate.setDate(startDate.getDate() - 1);
            endDate = startOfToday;
        } else if (period === "7days") {
            startDate = new Date(startOfToday);
            startDate.setDate(startDate.getDate() - 6);
            endDate = new Date(now);
            groupBy = "day";
        } else if (period === "30days") {
            startDate = new Date(startOfToday);
            startDate.setDate(startDate.getDate() - 29);
            endDate = new Date(now);
            groupBy = "day";
        } else if (period === "thismonth") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now);
            groupBy = "day";
        } else if (period === "lastmonth") {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            groupBy = "day";
        }

        const matchStage = { createdAt: { $gte: startDate, $lt: endDate || new Date() } };

        let hourlyData, purchaseHourlyData;

        if (groupBy === "hour") {
            hourlyData = await Invoice.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } } },
                        total: { $sum: convertToINR("$grandTotal") }
                    }
                }
            ]);
            purchaseHourlyData = await Purchase.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } } },
                        total: { $sum: "$grandTotal" }
                    }
                }
            ]);

            const salesSeries = new Array(12).fill(0);
            const purchaseSeries = new Array(12).fill(0);

            hourlyData.forEach(item => {
                const bucketIndex = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].findIndex(h => item._id.hour < h);
                if (bucketIndex !== -1) salesSeries[bucketIndex] += Number((item.total / 1000).toFixed(2));
            });
            purchaseHourlyData.forEach(item => {
                const bucketIndex = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].findIndex(h => item._id.hour < h);
                if (bucketIndex !== -1) purchaseSeries[bucketIndex] += Number((item.total / 1000).toFixed(2));
            });

            return res.json({
                status: true,
                data: { sales: salesSeries, purchases: purchaseSeries, categories }
            });
        } else {
            // Group by Day
            const dailyData = await Invoice.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        total: { $sum: convertToINR("$grandTotal") }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            const dailyPurchaseData = await Purchase.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        total: { $sum: "$grandTotal" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Create range of dates
            const dateList = [];
            let curr = new Date(startDate);
            while (curr <= endDate) {
                dateList.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }

            const salesSeries = dateList.map(date => {
                const found = dailyData.find(d => d._id === date);
                return found ? Number((found.total / 1000).toFixed(2)) : 0;
            });
            const purchaseSeries = dateList.map(date => {
                const found = dailyPurchaseData.find(d => d._id === date);
                return found ? Number((found.total / 1000).toFixed(2)) : 0;
            });

            return res.json({
                status: true,
                data: {
                    sales: salesSeries,
                    purchases: purchaseSeries,
                    categories: dateList.map(d => d.split('-').slice(1).join('/')) // MM/DD
                }
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getTopSelling = async (req, res) => {
    try {
        const { period = "today" } = req.query;
        const now = new Date();

        // Fetch USD and INR rates for conversion
        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });
        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;
        const usdToInrMultiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const convertToINR = (field) => ({
            $cond: [
                { $eq: ["$invoiceType", "International"] },
                { $multiply: [field, usdToInrMultiplier] },
                field
            ]
        });

        let startDate;
        if (period === "today") {
            startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Monthly
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const topSellingProducts = await Invoice.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalQty: { $sum: "$items.quantity" },
                    totalAmount: { $sum: convertToINR("$items.amount") },
                    productName: { $first: "$items.productName" }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQty: 1,
                    totalAmount: 1,
                    productName: 1,
                    images: { $arrayElemAt: ["$productDetails.images", 0] }
                }
            }
        ]);

        res.json({ status: true, data: topSellingProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getRecentTransactions = async (req, res) => {
    try {
        const { period = "today" } = req.query;
        const now = new Date();

        let startDate;
        if (period === "today") {
            startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            startDate.setHours(0, 0, 0, 0);
        } else if (period === "weekly") {
            startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Monthly
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });
        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;
        const usdToInrMultiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const matchStage = { createdAt: { $gte: startDate } };

        const sales = await Invoice.find(matchStage).sort({ createdAt: -1 }).limit(10).populate("customerId", "firstName lastName").populate("items.productId", "images");
        const purchases = await Purchase.find(matchStage).sort({ createdAt: -1 }).limit(10);
        const quotations = await Quotation.find(matchStage).sort({ createdAt: -1 }).limit(10).populate("customerId", "firstName lastName");
        const invoices = await Invoice.find({ ...matchStage, type: { $ne: "Sale" } }).sort({ createdAt: -1 }).limit(10).populate("customerId", "firstName lastName avatar").populate("items.productId", "images");

        const processItems = (items, type) => items.map(item => {
            const doc = item.toObject();
            if (type === 'sale' || type === 'invoice') {
                if (doc.invoiceType === "International") {
                    doc.grandTotal = doc.grandTotal * usdToInrMultiplier;
                    doc.paidAmount = doc.paidAmount * usdToInrMultiplier;
                }
            } else if (type === 'quotation') {
                if (doc.quotationType === "International") {
                    doc.grandTotal = doc.grandTotal * usdToInrMultiplier;
                }
            } else if (type === 'purchase') {
                doc.purchaseNo = doc.purchaseNumber;
            }
            return doc;
        });

        res.json({
            status: true,
            data: {
                recentSales: processItems(sales, 'sale'),
                recentPurchases: processItems(purchases, 'purchase'),
                recentQuotations: processItems(quotations, 'quotation'),
                invoices: processItems(invoices, 'invoice')
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getTopCustomers = async (req, res) => {
    try {
        const { period = "monthly" } = req.query;
        const now = new Date();

        // Fetch USD and INR rates for conversion
        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });
        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;
        const usdToInrMultiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const convertToINR = (field) => ({
            $cond: [
                { $eq: ["$invoiceType", "International"] },
                { $multiply: [field, usdToInrMultiplier] },
                field
            ]
        });

        let startDate;
        if (period === "today") {
            startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Monthly (current month)
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const topCustomers = await Invoice.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: "$customerId",
                    totalSpend: { $sum: convertToINR("$grandTotal") },
                    orderCount: { $count: {} }
                }
            },
            { $sort: { totalSpend: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customerInfo"
                }
            },
            { $unwind: "$customerInfo" }
        ]);

        res.status(200).json({ status: true, data: topCustomers });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getTopCategories = async (req, res) => {
    try {
        const { period = "monthly" } = req.query;
        const now = new Date();

        // Fetch USD and INR rates for conversion
        const usdCurrency = await Currency.findOne({ code: "USD" });
        const inrCurrency = await Currency.findOne({ code: "INR" });
        const usdVal = usdCurrency ? parseFloat(usdCurrency.rate) : 1;
        const inrVal = inrCurrency ? parseFloat(inrCurrency.rate) : 0.012;
        const usdToInrMultiplier = inrVal > 0 ? (usdVal / inrVal) : 83;

        const convertToINR = (field) => ({
            $cond: [
                { $eq: ["$invoiceType", "International"] },
                { $multiply: [field, usdToInrMultiplier] },
                field
            ]
        });

        let startDate;
        if (period === "today") {
            startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Monthly
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const categoryStats = await Invoice.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.categoryId",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
                    salesCount: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: convertToINR("$items.amount") }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 3 }
        ]);

        res.status(200).json({ status: true, data: categoryStats });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

export const getOrdersHeatmap = async (req, res) => {
    try {
        const { period = "monthly" } = req.query;
        const now = new Date();
        let startDate;

        if (period === "weekly") {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === "today") {
            startDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Default 30 days or monthly
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
        }

        const stats = await Invoice.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        hour: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const heatmap = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map(h => ({
            name: `${h > 12 ? h - 12 : h} ${h < 12 || h === 24 ? 'am' : 'pm'}`,
            data: days.map(d => ({ x: d, y: 0 }))
        }));

        stats.forEach(stat => {
            const dayName = days[stat._id.day - 1];
            const hour = stat._id.hour;
            const bucketIndex = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].findIndex(h => hour < h);
            if (bucketIndex !== -1) {
                const dayIndex = days.indexOf(dayName);
                heatmap[bucketIndex].data[dayIndex].y += stat.count;
            }
        });

        res.status(200).json({ status: true, data: heatmap });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
