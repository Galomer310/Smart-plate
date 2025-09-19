// frontend/src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/srote"; // ✅ ensure this path matches your project
import { logout } from "../store/authSlice"; // ✅
import axios from "axios";
import logo from "../assets/smart-plate-logo.jpeg";

const Navbar: React.FC = () => {
  const tokenFromStore = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Prefer Redux token; fallback to explicit admin token for admin area
  const token = tokenFromStore || localStorage.getItem("adminToken") || "";

  // Determine role from token payload
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

  // Fetch unread for current principal (user OR admin)
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/messages/new", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const data = response.data as { messages: any[] };
        setUnreadCount(data.messages.length || 0);
      })
      .catch((error) => {
        console.error("Error fetching unread messages in Navbar:", error);
      });
  }, [token]);

  const handleMessagesClick = () => setUnreadCount(0);

  const msgLink = isAdmin ? "/admin/messages" : "/messages";

  const linkStyle =
    unreadCount > 0
      ? {
          padding: "2px 8px",
          borderRadius: 999,
          color: "#fff",
          background: "#d32f2f",
        }
      : undefined;

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("adminToken");
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
            <Link to={msgLink} onClick={handleMessagesClick} style={linkStyle}>
              Messages {unreadCount > 0 && <span>({unreadCount})</span>}
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
