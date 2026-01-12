const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

router.post("/create", salesController.createBill);       // Create bill
router.get("/", salesController.getAllSales);            // List all bills
router.get("/:sale_id/items", salesController.getSaleItems); // Get items in a bill

module.exports = router;
