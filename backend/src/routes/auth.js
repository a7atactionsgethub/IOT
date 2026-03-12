const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db/database");

const SECRET = process.env.JWT_SECRET || "smart-uri-secret-key";

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const user = db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid username or password" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, patient_id: user.patient_id },
    SECRET, { expiresIn: "12h" }
  );
  res.json({ token, username: user.username, role: user.role, patient_id: user.patient_id });
});

// GET /api/auth/users — admin only
router.get("/users", require("../middleware/auth").auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const users = db.all(`
    SELECT u.id, u.username, u.role, u.patient_id, u.created_at, p.name as patient_name
    FROM users u LEFT JOIN patients p ON u.patient_id = p.id
    ORDER BY u.created_at DESC
  `);
  res.json(users);
});

// POST /api/auth/users — admin only
router.post("/users", require("../middleware/auth").auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { username, password, role = "user", patient_id = null } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const existing = db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) return res.status(400).json({ error: "Username already exists" });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.run(
    "INSERT INTO users (username, password, role, patient_id) VALUES (?, ?, ?, ?)",
    [username, hashed, role, patient_id]
  );
  res.json({ id: result.lastInsertRowid, username, role, patient_id });
});

// DELETE /api/auth/users/:id — admin only
router.delete("/users/:id", require("../middleware/auth").auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  if (req.user.id === Number(req.params.id)) return res.status(400).json({ error: "Cannot delete yourself" });
  db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;