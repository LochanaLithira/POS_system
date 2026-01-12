const db = require("../database");


// ADD PRODUCT
exports.addProduct = (req, res) => {
  const {
    name,
    category,
    unit_type,
    cost_price,
    selling_price,
    stock_quantity,
    min_stock,
    supplier
  } = req.body;

  const query = `
    INSERT INTO products 
    (name, category, unit_type, cost_price, selling_price, stock_quantity, min_stock, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [name, category, unit_type, cost_price, selling_price, stock_quantity, min_stock, supplier],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Product added successfully", productId: this.lastID });
    }
  );
};

// GET ALL PRODUCTS
exports.getAllProducts = (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

// UPDATE PRODUCT
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    unit_type,
    cost_price,
    selling_price,
    stock_quantity,
    min_stock,
    supplier
  } = req.body;

  const query = `
    UPDATE products SET
      name = ?,
      category = ?,
      unit_type = ?,
      cost_price = ?,
      selling_price = ?,
      stock_quantity = ?,
      min_stock = ?,
      supplier = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [
      name,
      category,
      unit_type,
      cost_price,
      selling_price,
      stock_quantity,
      min_stock,
      supplier,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Product updated successfully" });
    }
  );
};

// DELETE PRODUCT
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Product deleted successfully" });
  });
};

// LOW STOCK PRODUCTS
exports.getLowStockProducts = (req, res) => {
  db.all(
    "SELECT * FROM products WHERE stock_quantity <= min_stock",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
};
