const db = require("../database");

// HELPER: Generate Unique Bill Number
function generateBillNumber() {
  const now = new Date();
  return 'BILL-' + now.getFullYear().toString().slice(-2) +
         (now.getMonth()+1).toString().padStart(2,'0') +
         now.getDate().toString().padStart(2,'0') +
         '-' + Math.floor(Math.random()*10000);
}

// HELPER: Promisify db methods for transaction support
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// CREATE NEW BILL (with stock validation & transaction)
exports.createBill = async (req, res) => {
  const { items, discount = 0, payment_method } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in bill" });
  }

  try {
    // 1. VALIDATE STOCK AVAILABILITY FOR ALL ITEMS
    for (const item of items) {
      const product = await dbGet(
        "SELECT id, name, stock_quantity FROM products WHERE id = ?",
        [item.product_id]
      );

      if (!product) {
        return res.status(404).json({ 
          error: `Product with ID ${item.product_id} not found` 
        });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
        });
      }
    }

    // 2. BEGIN TRANSACTION
    await dbRun("BEGIN TRANSACTION");

    try {
      // 3. Calculate subtotal
      let subtotal = 0;
      items.forEach(item => {
        subtotal += item.quantity * item.price;
      });

      const total_amount = subtotal - discount;
      const bill_number = generateBillNumber();

      // 4. INSERT BILL HEADER
      const saleResult = await dbRun(
        `INSERT INTO sales (bill_number, subtotal, discount, total_amount, payment_method) 
         VALUES (?, ?, ?, ?, ?)`,
        [bill_number, subtotal, discount, total_amount, payment_method]
      );

      const sale_id = saleResult.lastID;

      // 5. INSERT SALE ITEMS & DEDUCT STOCK
      for (const item of items) {
        await dbRun(
          `INSERT INTO sale_items 
           (sale_id, product_id, product_name, unit_type, quantity, price, total) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [sale_id, item.product_id, item.name, item.unit_type, item.quantity, item.price, item.quantity * item.price]
        );

        await dbRun(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }

      // 6. COMMIT TRANSACTION
      await dbRun("COMMIT");

      res.json({ message: "Bill created successfully", bill_number, sale_id });

    } catch (err) {
      // ROLLBACK on any error
      await dbRun("ROLLBACK");
      throw err;
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// CANCEL SALE (Delete sale and restore stock)
exports.cancelSale = async (req, res) => {
  const { sale_id } = req.params;

  try {
    // 1. Check if sale exists
    const sale = await dbGet("SELECT * FROM sales WHERE id = ?", [sale_id]);
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    // 2. Get all items from this sale
    const saleItems = await dbAll("SELECT * FROM sale_items WHERE sale_id = ?", [sale_id]);

    // 3. BEGIN TRANSACTION
    await dbRun("BEGIN TRANSACTION");

    try {
      // 4. Restore stock for each item
      for (const item of saleItems) {
        await dbRun(
          `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }

      // 5. Delete sale items
      await dbRun("DELETE FROM sale_items WHERE sale_id = ?", [sale_id]);

      // 6. Delete sale header
      await dbRun("DELETE FROM sales WHERE id = ?", [sale_id]);

      // 7. COMMIT
      await dbRun("COMMIT");

      res.json({ 
        message: "Sale cancelled successfully", 
        bill_number: sale.bill_number,
        items_restored: saleItems.length 
      });

    } catch (err) {
      await dbRun("ROLLBACK");
      throw err;
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
