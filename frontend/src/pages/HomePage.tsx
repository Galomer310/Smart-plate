// src/components/HomePage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Welcome to Smart-plate</h1>
      <p>
        Smart-plate has two areas: a user portal for members and an admin portal
        for managing accounts and plans.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "0.6rem 1rem", cursor: "pointer" }}
        >
          User Login
        </button>

        <button
          onClick={() => navigate("/admin/login")}
          style={{ padding: "0.6rem 1rem", cursor: "pointer" }}
        >
          Admin Login
        </button>
      </div>
    </div>
  );
};

export default HomePage;
