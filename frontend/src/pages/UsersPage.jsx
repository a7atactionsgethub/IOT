import { useState, useEffect } from "react";
import api from "../services/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
    name: "",
    age: "",
    device_id: ""
  });
  const [error, setError] = useState("");

  const load = () => {
    api.get("/auth/users").then(r => setUsers(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.username || !form.password) return setError("Username and password required");
    try {
      await api.post("/auth/users", form);
      setForm({ username: "", password: "", role: "user", name: "", age: "", device_id: "" });
      setError("");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Failed to create user");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/auth/users/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="border border-black/20 rounded p-5 space-y-3">
        <p className="text-xs font-semibold text-black/40 uppercase tracking-wider">Add New User</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="password"
            className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">User (Patient)</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === "user" && (
            <>
              <input
                className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="number"
                className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                placeholder="Age"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
              />
              <input
                className="border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                placeholder="Device ID"
                value={form.device_id}
                onChange={e => setForm({ ...form, device_id: e.target.value })}
              />
            </>
          )}
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button
          onClick={handleAdd}
          className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-black/80 transition-colors"
        >
          Add User
        </button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="border border-black/20 rounded p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{u.username}</p>
              <p className="text-black/40 text-xs">
                {u.role}
                {u.role === "user" && u.name && ` · ${u.name}, ${u.age || "?"} yrs`}
                {u.device_id && ` · Device: ${u.device_id}`}
                · Added {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(u.id)}
              className="text-xs text-black/30 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}