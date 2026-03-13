import { useState, useEffect } from "react";
import MarkerDetail from "../components/MarkerDetail";
import UsersPage from "./UsersPage";
import api from "../services/api";
import { MARKERS, isAlert } from "../constants/markers";

export default function Dashboard({ role, onLogout }) {
  const [activeTab, setActiveTab] = useState(MARKERS[0].key);
  const [alerts, setAlerts] = useState([]);
  const [latestReadings, setLatestReadings] = useState([]);
  const [users, setUsers] = useState([]);               // all users (for admin dropdown)
  const [selectedUserId, setSelectedUserId] = useState(null); // for admin selection
  const username = localStorage.getItem("username");
  const currentUserId = localStorage.getItem("user_id");

  // For non-admin, selected user is themselves
  useEffect(() => {
    if (role !== "admin") {
      setSelectedUserId(currentUserId);
    }
  }, [role, currentUserId]);

  // Fetch all users (for admin dropdown)
  useEffect(() => {
    if (role === "admin") {
      api.get("/auth/users")
        .then(r => {
          setUsers(r.data);
          // Optionally select the first patient by default
          const firstPatient = r.data.find(u => u.role === "user");
          if (firstPatient) setSelectedUserId(firstPatient.id);
        })
        .catch(() => {});
    }
  }, [role]);

  // Fetch alerts (filter by selected user if any)
  useEffect(() => {
    const params = selectedUserId ? { user_id: selectedUserId, limit: 50 } : { limit: 50 };
    api.get("/alerts", { params })
      .then(r => setAlerts(r.data))
      .catch(() => {});
  }, [selectedUserId]);

  // Fetch latest readings (for sidebar badges) – always global, or filtered? For badges we might want global or per user.
  // Keeping global for simplicity (shows if any alert exists)
  useEffect(() => {
    api.get("/readings/latest")
      .then(r => setLatestReadings(r.data))
      .catch(() => {});
    const interval = setInterval(() => {
      api.get("/readings/latest")
        .then(r => setLatestReadings(r.data))
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const latestReading = latestReadings[0];

  // Prepare sidebar items (unchanged)
  const sidebarItems = [
    ...MARKERS.map(m => ({
      key: m.key,
      label: m.label,
      icon: m.icon,
      alert: latestReading ? isAlert(m, latestReading[m.key]) : false,
    })),
    { key: "alerts", label: "Alerts", icon: "⚠", badge: alerts.length },
    ...(role === "admin" ? [{ key: "users", label: "Users", icon: "👤" }] : []),
  ];

  const activeMarker = MARKERS.find(m => m.key === activeTab);

  // Handle user selection change
  const handleUserChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  return (
    <div className="min-h-screen text-gray-900 flex flex-col">
      {/* Header with user dropdown for admin */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-tight text-blue-600">UROSENSE</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-700">{username}</span>
          {role === "admin" && (
            <>
              <span className="text-xs bg-clinical-light text-clinical border border-clinical rounded px-2 py-0.5">
                admin
              </span>
              {/* User dropdown */}
              <select
                value={selectedUserId || ""}
                onChange={handleUserChange}
                className="ml-4 text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="" disabled>Select a patient</option>
                {users.filter(u => u.role === "user").map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.username} {u.device_id ? `(${u.device_id})` : ''}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <button
            onClick={onLogout}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar – using nav-item classes */}
        <aside className="w-52 border-r border-gray-200 bg-gray-50/50 p-3 flex flex-col gap-1">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`nav-item ${activeTab === item.key ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.alert && activeTab !== item.key && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-auto" />
              )}
              {item.badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ml-auto ${
                  activeTab === item.key
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-600 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50/30">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {activeMarker?.label ?? (activeTab === "alerts" ? "Alerts" : "Users")}
          </h2>

          {/* Show marker details only if a user is selected */}
          {activeMarker && selectedUserId && (
            <MarkerDetail marker={activeMarker} userId={selectedUserId} role={role} />
          )}
          {activeMarker && !selectedUserId && role === "admin" && (
            <p className="text-gray-500">Please select a patient from the dropdown.</p>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-3">
              {alerts.length === 0 && (
                <p className="text-gray-500 text-sm">No alerts triggered for this user.</p>
              )}
              {alerts.map(a => (
                <div key={a.id} className="medical-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{a.patient_name}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">{a.alert_reasons}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
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