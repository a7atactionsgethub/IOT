const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.APP_USERNAME || "admin";
  const validPassword = process.env.APP_PASSWORD || "urosense123";
  const secret = process.env.JWT_SECRET || "urosense-secret-key";

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign({ username }, secret, { expiresIn: "12h" });
  res.json({ token });
});

// POST /api/auth/verify
router.post("/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "urosense-secret-key");
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
