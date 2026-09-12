import express from "express";
import { 
    getDashboardSummary, 
    getDashboardCharts, 
    getOrdersChart, 
    getTopSelling, 
    getRecentTransactions,
    getTopCustomers,
    getTopCategories,
    getOrdersHeatmap
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/charts", getDashboardCharts);
router.get("/orders-chart", getOrdersChart);
router.get("/top-selling", getTopSelling);
router.get("/recent-transactions", getRecentTransactions);
router.get("/top-customers", getTopCustomers);
router.get("/top-categories", getTopCategories);
router.get("/orders-heatmap", getOrdersHeatmap);

export default router;
