const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.post("/add", productController.addProduct);
router.get("/", productController.getAllProducts);
router.put("/update/:id", productController.updateProduct);
router.delete("/delete/:id", productController.deleteProduct);
router.get("/low-stock", productController.getLowStockProducts);

module.exports = router;
