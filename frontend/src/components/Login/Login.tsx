import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const Login: React.FC = () => {
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
        "/api/auth/login",
        credentials
      );
      // Save user access token and clear any admin token to avoid cross-role state
      localStorage.setItem("accessToken", r.data.token);
      localStorage.removeItem("adminToken");
      navigate("/personal");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Invalid credentials";
      alert(msg);
      console.error("User login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>User Login</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "0.5rem", maxWidth: 360 }}
      >
        <input
          type="email"
          name="email"
          placeholder="Email"
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

export default Login;
