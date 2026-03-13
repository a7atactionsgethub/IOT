export const MARKERS = [
  { key: "hydration_level", label: "Hydration", unit: "%", numeric: true, min: 40, max: 100, good: "above 40%", icon: " " },
  { key: "sugar_level", label: "Sugar Level", unit: "mmol/L", numeric: true, min: 0, max: 0.8, good: "below 0.8", icon: " " },
  { key: "uti_indicator", label: "UTI", binary: true, icon: " " },
  { key: "kidney_stone_indicator", label: "Kidney Stone", binary: true, icon: " " },
  { key: "alcohol_presence", label: "Alcohol", binary: true, icon: " " },
];

export function isAlert(marker, val) {
  if (val === null || val === undefined) return false;
  if (marker.binary) return val === 1;
  return val < (marker.min ?? 0) || val > marker.max;
}