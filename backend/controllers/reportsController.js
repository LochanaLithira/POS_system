const db = require("../database");

// 1️⃣ Daily Sales
exports.dailySales = (req, res) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const query = `
    SELECT SUM(total_amount) as total_sales 
    FROM sales 
    WHERE DATE(sold_at) = ?
  `;

  db.get(query, [dateStr], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ date: dateStr, total_sales: row.total_sales || 0 });
  });
};

// 2️⃣ Monthly Sales
exports.monthlySales = (req, res) => {
  const { year, month } = req.query; // e.g., ?year=2026&month=01
  if (!year || !month)
    return res.status(400).json({ error: "Provide year and month in query" });

  const query = `
    SELECT SUM(total_amount) as total_sales
    FROM sales
    WHERE strftime('%Y', sold_at) = ? AND strftime('%m', sold_at) = ?
  `;

  db.get(query, [year, month.padStart(2, "0")], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ year, month, total_sales: row.total_sales || 0 });
  });
};

// 3️⃣ Product-wise Sales
exports.productWiseSales = (req, res) => {
  const query = `
    SELECT product_name, SUM(quantity) as total_quantity, SUM(total) as total_sales
    FROM sale_items
    GROUP BY product_name
    ORDER BY total_sales DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// 4️⃣ Low Stock Items
exports.lowStockItems = (req, res) => {
  const query = `
    SELECT id, name, stock_quantity, min_stock
    FROM products
    WHERE stock_quantity <= min_stock
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// 5️⃣ Profit Report
exports.profitReport = (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      si.product_name,
      SUM(si.quantity) as total_quantity_sold,
      p.cost_price,
      si.price as selling_price,
      SUM(si.quantity * (si.price - p.cost_price)) as profit
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
  `;
  
  const params = [];
  
  if (start_date && end_date) {
    query += ` WHERE DATE(s.sold_at) BETWEEN ? AND ?`;
    params.push(start_date, end_date);
  }
  
  query += `
    GROUP BY si.product_id
    ORDER BY profit DESC
  `;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const total_profit = rows.reduce((sum, row) => sum + (row.profit || 0), 0);
    
    res.json({
      items: rows,
      total_profit: total_profit
    });
  });
};

// 6️⃣ Daily Profit
exports.dailyProfit = (req, res) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const query = `
    SELECT 
      SUM(si.quantity * (si.price - p.cost_price)) as total_profit,
      SUM(si.total) as total_revenue,
      SUM(si.quantity * p.cost_price) as total_cost
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE DATE(s.sold_at) = ?
  `;

  db.get(query, [dateStr], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      date: dateStr, 
      total_revenue: row.total_revenue || 0,
      total_cost: row.total_cost || 0,
      total_profit: row.total_profit || 0 
    });
  });
};
