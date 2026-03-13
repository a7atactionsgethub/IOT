const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db/database");

const SECRET = process.env.JWT_SECRET || "urosense-secret-key";

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const user = db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  // Plain text comparison (no bcrypt)
  if (password !== user.password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role }, // no patient_id anymore
    SECRET,
    { expiresIn: "12h" }
  );
  // Return user_id (id) for frontend to use in API calls
  res.json({
    token,
    username: user.username,
    role: user.role,
    user_id: user.id
  });
});

// GET /api/auth/users — admin only
router.get("/users", require("../middleware/auth").auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

  // Now users table contains all fields: id, username, role, name, age, device_id, created_at
  const users = db.all(`
    SELECT id, username, role, name, age, device_id, created_at
    FROM users
    ORDER BY created_at DESC
  `);
  res.json(users);
});

// POST /api/auth/users — admin only
router.post("/users", require("../middleware/auth").auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { username, password, role = "user", name, age, device_id } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const existing = db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) return res.status(400).json({ error: "Username already exists" });

  // Store password in plain text
  const result = db.run(
    `INSERT INTO users (username, password, role, name, age, device_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [username, password, role, name || null, age || null, device_id || null]
  );
  res.json({
    id: result.lastInsertRowid,
    username,
    role,
    name,
    age,
    device_id
  });
});

// DELETE /api/auth/users/:id — admin only
router.delete("/users/:id", require("../middleware/auth").auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  if (req.user.id === Number(req.params.id)) return res.status(400).json({ error: "Cannot delete yourself" });
  db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;