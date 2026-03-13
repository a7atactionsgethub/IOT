import { useState } from "react";
import api from "../services/api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) return setError("Enter username and password");
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("user_id", data.user_id);
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
        <h1 className="font-bold text-xl tracking-tight mb-1">UROSENSE</h1>
        <p className="text-black/40 text-xs mb-8">IoT Urine Monitor</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-black/50 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-black/50 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}