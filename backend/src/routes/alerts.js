const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/", (req, res) => {
  const { limit = 50 } = req.query;
  const pid = req.user.role !== "admin" ? req.user.patient_id : null;
  let query = `SELECT r.*, p.name as patient_name FROM readings r JOIN patients p ON r.patient_id = p.id WHERE r.alert_triggered = 1`;
  const params = [];
  if (pid) { query += " AND r.patient_id = ?"; params.push(Number(pid)); }
  query += " ORDER BY r.timestamp DESC LIMIT ?";
  params.push(Number(limit));
  res.json(db.all(query, params));
});

router.get("/count", (req, res) => {
  const pid = req.user.role !== "admin" ? req.user.patient_id : null;
  let query = "SELECT COUNT(*) as count FROM readings WHERE alert_triggered = 1";
  const params = [];
  if (pid) { query += " AND patient_id = ?"; params.push(Number(pid)); }
  res.json(db.get(query, params));
});

module.exports = router;

