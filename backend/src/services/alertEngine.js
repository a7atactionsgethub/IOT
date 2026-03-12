// Alert thresholds
const THRESHOLDS = {
  hydration_level: { min: 40, max: 100, unit: "%" },   // below 40% = dehydrated
  sugar_level: { min: 0, max: 0.8, unit: "mmol/L" },   // above 0.8 = high glucose
};

function checkAlerts(reading) {
  const reasons = [];

  if (reading.hydration_level !== null && reading.hydration_level !== undefined) {
    if (reading.hydration_level < THRESHOLDS.hydration_level.min)
      reasons.push(`Hydration low (${reading.hydration_level}% < ${THRESHOLDS.hydration_level.min}%)`);
  }

  if (reading.sugar_level !== null && reading.sugar_level !== undefined) {
    if (reading.sugar_level > THRESHOLDS.sugar_level.max)
      reasons.push(`Sugar level elevated (${reading.sugar_level} > ${THRESHOLDS.sugar_level.max} mmol/L)`);
  }

  if (reading.uti_indicator === 1 || reading.uti_indicator === true)
    reasons.push("Urinary tract infection indicator positive");

  if (reading.kidney_stone_indicator === 1 || reading.kidney_stone_indicator === true)
    reasons.push("Kidney stone indicator positive");

  if (reading.alcohol_presence === 1 || reading.alcohol_presence === true)
    reasons.push("Alcohol presence detected");

  return {
    alert_triggered: reasons.length > 0 ? 1 : 0,
    alert_reasons: reasons.join("; "),
  };
}

module.exports = { checkAlerts, THRESHOLDS };
