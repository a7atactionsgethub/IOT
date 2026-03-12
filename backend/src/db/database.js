const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const DB_PATH = path.resolve(process.env.DB_PATH || "./src/db/iot.db");

let db;

function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
  const res = db.exec("SELECT last_insert_rowid() as id");
  return { lastInsertRowid: res[0]?.values[0][0] ?? null };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, age INTEGER,
    device_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL, device_id TEXT NOT NULL,
    hydration_level REAL,
    sugar_level REAL,
    uti_indicator INTEGER DEFAULT 0,
    kidney_stone_indicator INTEGER DEFAULT 0,
    alcohol_presence INTEGER DEFAULT 0,
    alert_triggered INTEGER DEFAULT 0,
    alert_reasons TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    patient_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )`);

  persist();

  // Seed demo patient
  const patientCount = get("SELECT COUNT(*) as count FROM patients");
  if (!patientCount || patientCount.count === 0) {
    db.run("INSERT INTO patients (name, age, device_id) VALUES (?, ?, ?)", ["Demo Patient", 35, "DEVICE-001"]);
    persist();
  }

  // Seed admin user from .env if no users exist
  const userCount = get("SELECT COUNT(*) as count FROM users");
  if (!userCount || userCount.count === 0) {
    const adminUsername = process.env.APP_USERNAME || "admin";
    const adminPassword = process.env.APP_PASSWORD || "urosense123";
    const hashed = bcrypt.hashSync(adminPassword, 10);
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [adminUsername, hashed, "admin"]);
    persist();
    console.log(`✅ Admin user created: ${adminUsername}`);
  }

  console.log("✅ Database initialized");
}

module.exports = { init, run, get, all };

