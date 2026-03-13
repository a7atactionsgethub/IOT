import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/api";
import { isAlert } from "../constants/markers";

export default function MarkerDetail({ marker, userId, role }) {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  useEffect(() => {
    const params = role !== "admin" ? {} : (userId ? { user_id: userId } : {});
    api.get(`/readings/marker/${marker.key}`, { params }).then(r => {
      const data = r.data;
      setHistory([...data].reverse());
      setLatest(data[0] ?? null);
      setAlertHistory(data.filter(d => d.alert_triggered));
    });
  }, [marker.key, userId, role]);

  const val = latest?.value;
  const bad = isAlert(marker, val);

  const chartData = history.map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: h.value,
  }));

  return (
    <div className="space-y-6">
      <div className={`border rounded p-6 ${bad ? "border-black" : "border-black/20"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-black/40 text-xs uppercase tracking-wider mb-1">{marker.label}</p>
            {marker.binary ? (
              <p className={`text-5xl font-bold ${bad ? "text-black" : "text-black/30"}`}>
                {val === 1 ? "YES" : val === 0 ? "NO" : "—"}
              </p>
            ) : (
              <p className={`text-5xl font-bold tabular-nums ${bad ? "text-black" : "text-black/70"}`}>
                {val !== null && val !== undefined ? val : "—"}
                <span className="text-xl ml-1 text-black/30">{marker.unit}</span>
              </p>
            )}
            {latest && <p className="text-black/30 text-xs mt-2">{new Date(latest.timestamp).toLocaleString()}</p>}
          </div>
          <div className={`px-3 py-1 rounded border text-xs font-bold ${bad ? "border-black text-black" : "border-black/20 text-black/40"}`}>
            {bad ? "⚠ ALERT" : "NORMAL"}
          </div>
        </div>
        {!marker.binary && (
          <div className="mt-4 text-xs text-black/30">Normal range: {marker.good} {marker.unit}</div>
        )}
      </div>

      {marker.numeric && chartData.length > 1 && (
        <div className="border border-black/20 rounded p-5">
          <p className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-4">History</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fill: "#00000066", fontSize: 10 }} />
              <YAxis tick={{ fill: "#00000066", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #00000020", borderRadius: "6px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="value" stroke="#000" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="border border-black/20 rounded p-5">
        <p className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3">Alert History</p>
        {alertHistory.length === 0
          ? <p className="text-black/20 text-sm">No alerts for this marker.</p>
          : <div className="space-y-2">
              {alertHistory.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                  <p className="text-xs text-black/60">{a.alert_reasons}</p>
                  <p className="text-xs text-black/30 ml-4 shrink-0">{new Date(a.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}