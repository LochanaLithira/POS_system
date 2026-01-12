const express = require("express");
const cors = require("cors");
const db = require("./database");
const productRoutes = require("./routes/productRoutes");
const salesRoutes = require("./routes/salesRoutes");


const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// DATABASE TABLES
// ===============================

// USERS TABLE
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// PRODUCTS TABLE
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    unit_type TEXT,
    cost_price REAL,
    selling_price REAL,
    stock_quantity REAL,
    min_stock REAL,
    supplier TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// SALES TABLE (Bill Header)
db.run(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT,
    subtotal REAL,
    discount REAL,
    total_amount REAL,
    payment_method TEXT,
    sold_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// SALE ITEMS TABLE (Bill Items)
db.run(`
  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    product_name TEXT,
    unit_type TEXT,
    quantity REAL,
    price REAL,
    total REAL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  )
`);

// ===============================


app.use("/api/products", productRoutes); 
app.use("/api/sales", salesRoutes);



app.get("/", (req, res) => {
  res.send("Hardware POS Backend Running");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
