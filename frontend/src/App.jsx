import { useState, useEffect } from "react";
import { getLatestReadings, getAlerts } from "./services/api";

const NORMAL = {
  ph: { min: 4.5, max: 8.0 },
  glucose: { min: 0, max: 0.8 },
  protein_creatinine: { min: 0, max: 30 },
};

function isOff(key, val) {
  if (val === null || val === undefined) return false;
  const r = NORMAL[key];
  if (!r) return false;
  return (r.min !== undefined && val < r.min) || val > r.max;
}

export default function App() {
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tab, setTab] = useState("live");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function load() {
      const [r, a] = await Promise.all([getLatestReadings(), getAlerts({ limit: 20 })]);
      setReadings(r);
      setAlerts(a);
      setLastUpdated(new Date().toLocaleTimeString());
    }
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg tracking-tight">UROSENSE</span>
          <span className="ml-3 text-xs text-white/40">IoT Urine Monitor</span>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && <span className="text-xs text-white/30">Updated {lastUpdated}</span>}
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
      </header>

      <nav className="border-b border-white/20 px-6 flex gap-6">
        <button
          onClick={() => setTab("live")}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === "live" ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}
        >
          Live Readings
        </button>
        <button
          onClick={() => setTab("alerts")}
          className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "alerts" ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}
        >
          Alerts
          {alerts.length > 0 && (
            <span className="bg-white text-black text-xs px-1.5 py-0.5 rounded font-bold">{alerts.length}</span>
          )}
        </button>
      </nav>

      <main className="flex-1 px-6 py-6 max-w-4xl w-full mx-auto">
        {tab === "live" && (
          <div className="space-y-4">
            {readings.length === 0 && <p className="text-white/30 text-sm">Waiting for device data...</p>}
            {readings.map(r => (
              <div key={r.id} className={`border rounded p-5 ${r.alert_triggered ? "border-white" : "border-white/20"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">{r.patient_name}</p>
                    <p className="text-white/30 text-xs">{r.device_id} · {new Date(r.timestamp).toLocaleString()}</p>
                  </div>
                  {r.alert_triggered
                    ? <span className="text-xs font-bold border border-white px-2 py-1 rounded">⚠ ALERT</span>
                    : <span className="text-xs text-white/40 border border-white/20 px-2 py-1 rounded">NORMAL</span>
                  }
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "ph", label: "pH", val: r.ph },
                    { key: "glucose", label: "Glucose", val: r.glucose, unit: "mmol/L" },
                    { key: "protein_creatinine", label: "Protein / Creatinine", val: r.protein_creatinine, unit: "mg/g" },
                    { key: "nitrites", label: "Nitrites", special: r.nitrites ? "POSITIVE" : "NEGATIVE", alert: !!r.nitrites },
                  ].map(m => (
                    <div key={m.key} className={`border rounded p-3 ${(m.special ? m.alert : isOff(m.key, m.val)) ? "border-white bg-white/5" : "border-white/10"}`}>
                      <p className="text-white/40 text-xs mb-1">{m.label}</p>
                      <p className={`text-xl font-bold tabular-nums ${(m.special ? m.alert : isOff(m.key, m.val)) ? "text-white" : "text-white/60"}`}>
                        {m.special ?? (m.val !== null && m.val !== undefined ? `${m.val}` : "—")}
                      </p>
                      {m.unit && <p className="text-white/20 text-xs">{m.unit}</p>}
                    </div>
                  ))}
                </div>
                {r.alert_triggered && r.alert_reasons && (
                  <p className="mt-3 text-xs text-white/50 border-t border-white/10 pt-3">⚠ {r.alert_reasons}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "alerts" && (
          <div className="space-y-3">
            {alerts.length === 0 && <p className="text-white/30 text-sm">No alerts triggered.</p>}
            {alerts.map(a => (
              <div key={a.id} className="border border-white/20 rounded p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{a.patient_name}</span>
                  <span className="text-white/30 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-white/60 text-xs mb-2">{a.alert_reasons}</p>
                <div className="flex gap-4 text-xs text-white/30">
                  <span>pH {a.ph ?? "—"}</span>
                  <span>Glucose {a.glucose ?? "—"}</span>
                  <span>P/C {a.protein_creatinine ?? "—"}</span>
                  <span>Nitrites {a.nitrites ? "POS" : "NEG"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}