const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create or connect to database
const dbPath = path.join(__dirname, "database.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

module.exports = db;
