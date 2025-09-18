import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const AdminLogin: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post<{ token: string }>(
        "/api/admin/login",
        credentials
      );
      // Save admin token (and mirror to generic key for any shared interceptors)
      localStorage.setItem("adminToken", r.data.token);
      localStorage.setItem("token", r.data.token);
      navigate("/admin/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Invalid admin credentials";
      alert(msg);
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>האיזור החם של אורלי</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "0.5rem", maxWidth: 360 }}
      >
        <input
          type="email"
          name="email"
          placeholder="Admin Email"
          value={credentials.email}
          onChange={handleChange}
          required
          className="sp-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          required
          className="sp-input"
        />
        <button type="submit" className="sp-badge" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
