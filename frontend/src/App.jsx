import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.reload(); }
  return Promise.reject(err);
});

const MARKERS = [
  { key: "hydration_level", label: "Hydration", unit: "%", numeric: true, min: 40, max: 100, good: "above 40%", icon: "💧" },
  { key: "sugar_level", label: "Sugar Level", unit: "mmol/L", numeric: true, min: 0, max: 0.8, good: "below 0.8", icon: "🩸" },
  { key: "uti_indicator", label: "UTI", binary: true, icon: "🦠" },
  { key: "kidney_stone_indicator", label: "Kidney Stone", binary: true, icon: "🪨" },
  { key: "alcohol_presence", label: "Alcohol", binary: true, icon: "🍺" },
];

function isAlert(marker, val) {
  if (val === null || val === undefined) return false;
  if (marker.binary) return val === 1;
  return val < (marker.min ?? 0) || val > marker.max;
}

// ── Login ──────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("patient_id", data.patient_id ?? "");
      onLogin(data.role);
    } catch (e) {
      setError(e.response?.data?.error || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm border border-black/20 rounded p-8">
        <h1 className="font-bold text-xl tracking-tight mb-1">Smart URI</h1>
        <p className="text-black/40 text-xs mb-8">IoT Urine Monitor</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-black/50 block mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="Enter username" autoFocus />
          </div>
          <div>
            <label className="text-xs text-black/50 block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="Enter password" />
          </div>

          {error && (
            <div className="border border-black rounded px-3 py-2">
              <p className="text-black text-xs font-medium">⚠ {error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-black/80 transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Marker Detail View ─────────────────────────────────
function MarkerDetail({ marker, patientId, role }) {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  useEffect(() => {
    const params = role !== "admin" ? {} : (patientId ? { patient_id: patientId } : {});
    api.get(`/readings/marker/${marker.key}`, { params }).then(r => {
      const data = r.data;
      setHistory([...data].reverse());
      setLatest(data[0] ?? null);
      setAlertHistory(data.filter(d => d.alert_triggered));
    });
  }, [marker.key, patientId]);

  const val = latest?.value;
  const bad = isAlert(marker, val);

  const chartData = history.map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: h.value,
  }));

  return (
    <div className="space-y-6">
      {/* Current status card */}
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
          <div className="mt-4 text-xs text-black/30">
            Normal range: {marker.good} {marker.unit}
          </div>
        )}
      </div>

      {/* Chart — numeric only */}
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

      {/* Alert history */}
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

// ── Users Management ───────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "user", patient_id: "" });
  const [error, setError] = useState("");

  const load = () => {
    api.get("/auth/users").then(r => setUsers(r.data));
    api.get("/patients").then(r => setPatients(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.username || !form.password) return setError("Username and password required");
    try {
      await api.post("/auth/users", { ...form, patient_id: form.patient_id || null });
      setForm({ username: "", password: "", role: "user", patient_id: "" });
      setError(""); load();
    } catch (e) { setError(e.response?.data?.error || "Failed to create user"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/auth/users/${id}`); load();
  };

  return (
    <div className="space-y-6">
      <div className="border border-black/20 rounded p-5 space-y-3">
        <p className="text-xs font-semibold text-black/40 uppercase tracking-wider">Add New User</p>
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <input type="password" className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <select className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="user">User (Patient)</option>
            <option value="admin">Admin</option>
          </select>
          <select className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">No patient linked</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.device_id})</option>)}
          </select>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button onClick={handleAdd}
          className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-black/80 transition-colors">
          Add User
        </button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="border border-black/20 rounded p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{u.username}</p>
              <p className="text-black/40 text-xs">
                {u.role} {u.patient_name ? `· linked to ${u.patient_name}` : "· no patient linked"}
                · Added {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => handleDelete(u.id)} className="text-xs text-black/30 hover:text-red-600 transition-colors">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────
function Dashboard({ role }) {
  const [activeTab, setActiveTab] = useState(MARKERS[0].key);
  const [alerts, setAlerts] = useState([]);
  const [latestReadings, setLatestReadings] = useState([]);
  const username = localStorage.getItem("username");
  const patientId = localStorage.getItem("patient_id");

  useEffect(() => {
    const load = () => {
      api.get("/alerts?limit=50").then(r => setAlerts(r.data));
      api.get("/readings/latest").then(r => setLatestReadings(r.data));
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { localStorage.clear(); window.location.reload(); };

  // Get latest value for each marker for sidebar badges
  const latestReading = latestReadings[0];

  const sidebarItems = [
    ...MARKERS.map(m => ({
      key: m.key, label: m.label, icon: m.icon,
      alert: latestReading ? isAlert(m, latestReading[m.key]) : false,
    })),
    { key: "alerts", label: "Alerts", icon: "⚠", badge: alerts.length },
    ...(role === "admin" ? [{ key: "users", label: "Users", icon: "👤" }] : []),
  ];

  const activeMarker = MARKERS.find(m => m.key === activeTab);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Top bar */}
      <header className="border-b border-black/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight">Smart URI</span>
          <span className="text-black/20">|</span>
          <span className="text-sm font-medium">{username}</span>
          {role === "admin" && <span className="text-xs border border-black/20 px-2 py-0.5 rounded text-black/40">admin</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <button onClick={handleLogout} className="text-xs text-black/40 hover:text-black transition-colors">Sign out</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 border-r border-black/10 flex flex-col py-4">
          {sidebarItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${activeTab === item.key ? "bg-black text-white" : "text-black/50 hover:text-black hover:bg-black/5"}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.alert && activeTab !== item.key && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
              {item.badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${activeTab === item.key ? "bg-white text-black" : "bg-black text-white"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <h2 className="font-semibold text-lg mb-6">
            {activeMarker?.label ?? (activeTab === "alerts" ? "Alerts" : "Users")}
          </h2>

          {activeMarker && (
            <MarkerDetail marker={activeMarker} patientId={patientId} role={role} />
          )}

          {activeTab === "alerts" && (
            <div className="space-y-3">
              {alerts.length === 0 && <p className="text-black/30 text-sm">No alerts triggered.</p>}
              {alerts.map(a => (
                <div key={a.id} className="border border-black/20 rounded p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{a.patient_name}</span>
                    <span className="text-black/30 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-black/60 text-xs mb-2">{a.alert_reasons}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-black/30">
                    <span>Hydration {a.hydration_level ?? "—"}%</span>
                    <span>Sugar {a.sugar_level ?? "—"} mmol/L</span>
                    <span>UTI {a.uti_indicator ? "YES" : "NO"}</span>
                    <span>Kidney Stone {a.kidney_stone_indicator ? "YES" : "NO"}</span>
                    <span>Alcohol {a.alcohol_presence ? "YES" : "NO"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "users" && role === "admin" && <UsersPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  return authed
    ? <Dashboard role={role} />
    : <LoginPage onLogin={(r) => { setRole(r); setAuthed(true); }} />;
}