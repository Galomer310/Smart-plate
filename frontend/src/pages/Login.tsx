// src/components/Login.tsx

import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  // Local state for login credentials
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const dispatch = useDispatch(); // Redux dispatch hook
  const navigate = useNavigate(); // Navigation hook

  // Update credentials state on input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send login request to backend
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        credentials
      );
      console.log("Login successful:", response.data);
      // Dispatch login action to update Redux state
      dispatch(login(response.data));
      // Navigate to personal area after successful login
      navigate("/personal");
    } catch (error: any) {
      console.error("Login error:", error);
      // Alert the user with the error message from the backend
      alert(error.response.data.error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {/* Login form */}
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
