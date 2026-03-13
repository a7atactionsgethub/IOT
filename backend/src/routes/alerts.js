const express = require("express");
const router = express.Router();
const db = require("../db/database");

// GET /api/alerts – optionally filtered by user_id (for admin)
router.get("/", (req, res) => {
  const { limit = 50, user_id } = req.query;
  const isAdmin = req.user.role === "admin";

  // Base query joining readings with users to get patient_name
  let query = `
    SELECT r.*, u.name as patient_name
    FROM readings r
    JOIN users u ON r.user_id = u.id
    WHERE r.alert_triggered = 1
  `;
  const params = [];

  // For non-admin, always filter by their own user_id
  if (!isAdmin) {
    query += " AND r.user_id = ?";
    params.push(req.user.id);
  }
  // For admin, if a specific user_id is provided, filter by it
  else if (user_id) {
    query += " AND r.user_id = ?";
    params.push(user_id);
  }

  query += " ORDER BY r.timestamp DESC LIMIT ?";
  params.push(Number(limit));

  const alerts = db.all(query, params);
  res.json(alerts);
});

// GET /api/alerts/count – count of alerts (optionally filtered)
router.get("/count", (req, res) => {
  const { user_id } = req.query;
  const isAdmin = req.user.role === "admin";

  let query = "SELECT COUNT(*) as count FROM readings WHERE alert_triggered = 1";
  const params = [];

  if (!isAdmin) {
    query += " AND user_id = ?";
    params.push(req.user.id);
  } else if (user_id) {
    query += " AND user_id = ?";
    params.push(user_id);
  }

  const result = db.get(query, params);
  res.json(result);
});

module.exports = router;