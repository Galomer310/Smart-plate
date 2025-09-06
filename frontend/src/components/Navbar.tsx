// frontend/src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/srote"; // keep your current path
import { logout } from "../store/authSlice";
import axios from "axios";

// ✅ Option A: import the asset from src/assets
// Make sure the file is at: frontend/src/assets/smart-plate-logo.jpeg
import logo from "../assets/smart-plate-logo.jpeg";

// If you prefer Option B (public folder), remove the import above and set:
// const logo = "/smart-plate-logo.jpeg";

const Navbar: React.FC = () => {
  const tokenFromStore = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Use redux token if present, otherwise fall back to localStorage (admin area)
  const token = tokenFromStore || localStorage.getItem("adminToken") || "";

  // Determine if the logged-in user is an admin (JWT payload has `role`)
  let isAdmin = false;
  if (token) {
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const decoded = JSON.parse(atob(payloadBase64));
        isAdmin = decoded?.role === "admin";
      }
    } catch (error) {
      console.error("Error decoding token in Navbar:", error);
    }
  }

  // For regular users (not admin), fetch unread admin messages
  useEffect(() => {
    if (token && !isAdmin) {
      axios
        .get("http://localhost:5000/api/messages/new", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const data = response.data as { messages: any[] };
          setUnreadCount(data.messages.length);
        })
        .catch((error) => {
          console.error("Error fetching unread messages in Navbar:", error);
        });
    }
  }, [token, isAdmin]);

  const handleMessagesClick = () => setUnreadCount(0);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("adminToken"); // ensure admin token is cleared too
    navigate("/");
  };

  return (
    <nav
      style={{
        backgroundColor: "#f8f8f8",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src={logo}
          alt="Smart-Plate logo"
          style={{
            height: "40px",
            marginRight: "0.75rem",
            borderRadius: 6,
            objectFit: "cover",
          }}
        />
        <Link
          to="/"
          style={{
            fontWeight: "bold",
            fontSize: "1.2rem",
            color: "#333",
            textDecoration: "none",
          }}
        >
          Smart-Plate
        </Link>
      </div>

      <ul
        style={{
          listStyleType: "none",
          display: "flex",
          gap: "1rem",
          margin: 0,
          padding: 0,
        }}
      >
        <li>
          <Link to="/">Home</Link>
        </li>

        {token && (
          <li>
            <Link to="/messages" onClick={handleMessagesClick}>
              Messages{" "}
              {unreadCount > 0 && (
                <span style={{ color: "red" }}>({unreadCount})</span>
              )}
            </Link>
          </li>
        )}

        <li>
          <Link to="/admin/login">Admin</Link>
        </li>

        {token ? (
          <>
            {!isAdmin && (
              <li>
                <Link to="/personal">Personal Area</Link>
              </li>
            )}
            <li>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "inherit",
                  color: "#007bff",
                }}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
