const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

router.post("/create", salesController.createBill);       // Create bill
router.get("/", salesController.getAllSales);            // List all bills
router.get("/:sale_id/items", salesController.getSaleItems); // Get items in a bill
router.delete("/cancel/:sale_id", salesController.cancelSale); // Cancel sale & restore stock

module.exports = router;
