import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  const handleLogin = (r) => {
    setRole(r);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthed(false);
    setRole(null);
  };

  useEffect(() => {
    const onUnauthorized = () => handleLogout();
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, []);

  return authed ? (
    <Dashboard role={role} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}