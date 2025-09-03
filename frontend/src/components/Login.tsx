// frontend/src/components/Login.tsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { login } from "../store/authSlice";

type UserLoginResponse = {
  user: any;
  tokens: { accessToken: string };
};

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use the shared API client (withCredentials: true) to set refresh cookie
      const { data } = await api.post<UserLoginResponse>(
        "/api/auth/login",
        credentials
      );

      const accessToken = data.tokens.accessToken;

      // Persist for api.ts interceptor
      localStorage.setItem("accessToken", accessToken);

      // Keep Redux in sync (authSlice expects { token, user })
      dispatch(login({ token: accessToken, user: data.user }));

      navigate("/personal");
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error?.response?.data?.error || "Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
