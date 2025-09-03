// src/App.tsx
import { Routes, Route } from "react-router-dom";

// Pages / Components
import HomePage from "./pages/HomePage"; // keep as-is if your HomePage lives in /pages
import Login from "./components/Login"; // ✅ moved to components
import Navbar from "./components/Navbar";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PersonalArea from "./components/PersonalArea"; // ✅ re-add from components

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* User side */}
        <Route path="/login" element={<Login />} />
        <Route path="/personal" element={<PersonalArea />} />{" "}
        {/* ✅ show questionnaire here */}
        {/* Admin side */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}
