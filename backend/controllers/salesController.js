const db = require("../database");

// HELPER: Generate Unique Bill Number
function generateBillNumber() {
  const now = new Date();
  return 'BILL-' + now.getFullYear().toString().slice(-2) +
         (now.getMonth()+1).toString().padStart(2,'0') +
         now.getDate().toString().padStart(2,'0') +
         '-' + Math.floor(Math.random()*10000);
}

// CREATE NEW BILL
exports.createBill = (req, res) => {
  const { items, discount = 0, payment_method } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in bill" });
  }

  let subtotal = 0;

  // Calculate subtotal for all items
  items.forEach(item => {
    subtotal += item.quantity * item.price;
  });

  const total_amount = subtotal - discount;
  const bill_number = generateBillNumber();

  // INSERT BILL HEADER
  db.run(
    `INSERT INTO sales (bill_number, subtotal, discount, total_amount, payment_method) 
     VALUES (?, ?, ?, ?, ?)`,
    [bill_number, subtotal, discount, total_amount, payment_method],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      const sale_id = this.lastID;

      // INSERT SALE ITEMS & DEDUCT STOCK
      const stmt = db.prepare(
        `INSERT INTO sale_items 
         (sale_id, product_id, product_name, unit_type, quantity, price, total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      items.forEach(item => {
        stmt.run(
          sale_id,
          item.product_id,
          item.name,
          item.unit_type,
          item.quantity,
          item.price,
          item.quantity * item.price
        );

        // DEDUCT STOCK
        db.run(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      });

      stmt.finalize(err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Bill created successfully", bill_number, sale_id });
      });
    }
  );
};

// GET ALL SALES
exports.getAllSales = (req, res) => {
  db.all("SELECT * FROM sales ORDER BY sold_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// GET SALE ITEMS BY BILL
exports.getSaleItems = (req, res) => {
  const { sale_id } = req.params;
  db.all(
    "SELECT * FROM sale_items WHERE sale_id = ?",
    [sale_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};
