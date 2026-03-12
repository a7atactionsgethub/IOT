const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { checkAlerts } = require("../services/alertEngine");

router.post("/", (req, res) => {
  const { device_id, hydration_level, sugar_level, uti_indicator, kidney_stone_indicator, alcohol_presence } = req.body;
  if (!device_id) return res.status(400).json({ error: "device_id is required" });

  const patient = db.get("SELECT * FROM patients WHERE device_id = ?", [device_id]);
  if (!patient) return res.status(404).json({ error: "Device not registered to any patient" });

  const { alert_triggered, alert_reasons } = checkAlerts({ hydration_level, sugar_level, uti_indicator, kidney_stone_indicator, alcohol_presence });

  const result = db.run(
    `INSERT INTO readings (patient_id, device_id, hydration_level, sugar_level, uti_indicator, kidney_stone_indicator, alcohol_presence, alert_triggered, alert_reasons)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patient.id, device_id, hydration_level, sugar_level,
      uti_indicator ? 1 : 0, kidney_stone_indicator ? 1 : 0, alcohol_presence ? 1 : 0,
      alert_triggered, alert_reasons]
  );
  res.json({ id: result.lastInsertRowid, alert_triggered, alert_reasons });
});

router.get("/", (req, res) => {
  const { patient_id, limit = 50 } = req.query;
  // If user role, force filter to their own patient
  const pid = req.user.role !== "admin" ? req.user.patient_id : patient_id;
  let query = `SELECT r.*, p.name as patient_name FROM readings r JOIN patients p ON r.patient_id = p.id`;
  const params = [];
  if (pid) { query += " WHERE r.patient_id = ?"; params.push(Number(pid)); }
  query += " ORDER BY r.timestamp DESC LIMIT ?";
  params.push(Number(limit));
  res.json(db.all(query, params));
});

router.get("/latest", (req, res) => {
  const pid = req.user.role !== "admin" ? req.user.patient_id : null;
  let query = `
    SELECT r.*, p.name as patient_name
    FROM readings r JOIN patients p ON r.patient_id = p.id
    WHERE r.id IN (SELECT MAX(id) FROM readings GROUP BY patient_id)
  `;
  const params = [];
  if (pid) { query += " AND r.patient_id = ?"; params.push(Number(pid)); }
  query += " ORDER BY r.timestamp DESC";
  res.json(db.all(query, params));
});

// GET readings for a specific marker with history
router.get("/marker/:marker", (req, res) => {
  const { marker } = req.params;
  const { patient_id, limit = 30 } = req.query;
  const pid = req.user.role !== "admin" ? req.user.patient_id : patient_id;

  const allowed = ["hydration_level", "sugar_level", "uti_indicator", "kidney_stone_indicator", "alcohol_presence"];
  if (!allowed.includes(marker)) return res.status(400).json({ error: "Invalid marker" });

  let query = `SELECT r.id, r.${marker} as value, r.timestamp, r.alert_triggered, r.alert_reasons, p.name as patient_name
    FROM readings r JOIN patients p ON r.patient_id = p.id`;
  const params = [];
  if (pid) { query += " WHERE r.patient_id = ?"; params.push(Number(pid)); }
  query += " ORDER BY r.timestamp DESC LIMIT ?";
  params.push(Number(limit));
  res.json(db.all(query, params));
});

module.exports = router;


