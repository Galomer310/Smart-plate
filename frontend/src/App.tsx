// src/App.tsx
// App routing for Smart-Plate
// - Reflects your new folder moves
// - Adds an admin messages list route (/admin/messages) in addition to the
//   param route (/admin/messages/:otherId)
// - Keeps user messaging routes and personal flows intact

import { Routes, Route } from "react-router-dom";

// Layout
import Navbar from "./components/Navbar";

// Pages / Feature roots
import HomePage from "./pages/HomePage";
import PersonalArea from "./components/personal/PersonalArea";
import AdminDashboard from "./components/admin/AdminDashboard";

// Logins
import Login from "./components/Login/Login";
import AdminLogin from "./components/Login/AdminLogin";

// Messaging (split by role)
import AdminMessagesPage from "./components/messages/AdminMessagesPage";
import UserMessagesPage from "./components/messages/UserMessagesPage";

// Force password change (moved into personal/)
import ForcePasswordChange from "./components/personal/ForcePasswordChange";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />

        {/* User */}
        <Route path="/login" element={<Login />} />
        <Route path="/personal" element={<PersonalArea />} />
        <Route path="/messages" element={<UserMessagesPage />} />
        <Route
          path="/messages/conversation/:otherId"
          element={<UserMessagesPage />}
        />
        <Route
          path="/force-password-change"
          element={<ForcePasswordChange />}
        />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* NEW: allow opening admin messages without specifying a user id */}
        <Route path="/admin/messages" element={<AdminMessagesPage />} />
        <Route
          path="/admin/messages/:otherId"
          element={<AdminMessagesPage />}
        />
      </Routes>
    </>
  );
}
