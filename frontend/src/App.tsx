// src/App.tsx
import { Routes, Route } from "react-router-dom";

// ✅ point to components (your files are there)
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
// import PersonalArea from "./pages/PersonalArea";

export default function App() {
  return (
    <>
      {/* ✅ Navbar must be outside <Routes> */}
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* User side */}
        <Route path="/login" element={<Login />} />
        {/* ✅ you navigate here after login, so this route must exist */}
        {/* <Route path="/personal" element={<PersonalArea />} /> */}

        {/* Admin side */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}
