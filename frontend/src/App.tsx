import { Routes, Route } from "react-router-dom";

// Layout
import Navbar from "./components/Navbar";

// Pages / Feature roots
import HomePage from "./pages/HomePage";
import PersonalArea from "./components/PersonalArea";
import AdminDashboard from "./components/AdminDashboard";

// Logins
import Login from "./components/Login/Login";
import AdminLogin from "./components/Login/AdminLogin";

// Messaging (split by role)
import AdminMessagesPage from "./components/messages/AdminMessagesPage";
import UserMessagesPage from "./components/messages/UserMessagesPage";

// ✅ New: force password change page
import ForcePasswordChange from "./components/ForcePasswordChange";

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
        {/* ✅ New route */}
        <Route
          path="/force-password-change"
          element={<ForcePasswordChange />}
        />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin/messages/:otherId"
          element={<AdminMessagesPage />}
        />
      </Routes>
    </>
  );
}
