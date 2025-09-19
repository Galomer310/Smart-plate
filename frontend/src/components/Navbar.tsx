// frontend/src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/srote";
import { logout } from "../store/authSlice";
import api from "../api"; // ✅ use your typed axios instance
import logo from "../assets/smart-plate-logo.jpeg";

type UnreadRes = { messages: any[] }; // shape returned by GET /api/messages/new

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer Redux token; fallback to localStorage (user/admin)
  const tokenFromStore = useSelector((s: RootState) => s.auth.token);
  const userToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const token = tokenFromStore || userToken || adminToken || "";

  // Decode role from JWT to decide routing
  let isAdmin = false;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      isAdmin = decoded?.role === "admin";
    } catch {
      // ignore decode errors
    }
  }

  // Unread count (works for both roles via /api/messages/new)
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      // ✅ TYPE THE RESPONSE so TS knows .messages exists
      const r = await api.get<UnreadRes>("/api/messages/new");
      const count = Array.isArray(r.data.messages) ? r.data.messages.length : 0;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnread();
    // also refetch when route changes (cheap polling surrogate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, location.pathname]);

  const msgLink = isAdmin ? "/admin/messages" : "/messages";

  const onClickMessages = () => {
    // Clear the pill immediately for snappier UX; server will mark-as-read on fetch
    setUnreadCount(0);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("adminToken");
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const msgStyle =
    unreadCount > 0
      ? {
          padding: "2px 10px",
          borderRadius: 999,
          color: "#fff",
          background: "#d32f2f", // solid red when unread
        }
      : undefined;

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
      {/* Left: Brand */}
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

      {/* Right: Nav Links */}
      <ul
        style={{
          listStyleType: "none",
          display: "flex",
          gap: "1rem",
          margin: 0,
          padding: 0,
          alignItems: "center",
        }}
      >
        <li>
          <Link to="/">Home</Link>
        </li>

        {/* Messages (visible when logged in as user or admin) */}
        {token && (
          <li>
            <Link to={msgLink} onClick={onClickMessages} style={msgStyle}>
              Messages {unreadCount > 0 && <span>({unreadCount})</span>}
            </Link>
          </li>
        )}

        <li>
          <Link to="/admin/login">Admin</Link>
        </li>

        {/* Auth area */}
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
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
