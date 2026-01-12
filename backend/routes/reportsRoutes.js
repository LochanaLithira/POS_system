const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");

// Daily sales
router.get("/daily", reportsController.dailySales);

// Monthly sales
router.get("/monthly", reportsController.monthlySales);

// Product-wise sales
router.get("/product-wise", reportsController.productWiseSales);

// Low-stock items
router.get("/low-stock", reportsController.lowStockItems);

// Profit reports
router.get("/profit", reportsController.profitReport);
router.get("/daily-profit", reportsController.dailyProfit);

module.exports = router;
