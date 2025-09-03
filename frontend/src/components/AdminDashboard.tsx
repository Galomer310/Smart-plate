// frontend/src/components/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

import "./admin/admin.css"; // ✅ add this line

import AddUserForm from "./admin/AddUserForm";
import UserFilters, { type Filters } from "./admin/UserFillters";
import UsersTable from "./admin/UsearsTable";

import type { DashboardResponse, User } from "./admin/types";
import { computeBMI } from "./admin/bmi";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    age: "",
    plan: "",
    bmi: "",
  });

  const adminToken = localStorage.getItem("adminToken");

  const fetchUsers = async () => {
    try {
      const response = await api.get<DashboardResponse>("/api/admin/dashboard");
      setUsers(response.data.users);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    if (adminToken) fetchUsers();
  }, [adminToken]);

  const handleDelete = async (userId: string, userEmail: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user ${userEmail}?`
    );
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      alert("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handlePlanUpdate = async (
    userId: string,
    currentPlan: string | null
  ) => {
    // kept for future use; not rendered in the table currently
    const planDescription = window.prompt(
      "Enter the subscription plan description:",
      currentPlan || ""
    );
    if (planDescription === null) return;
    const subscriptionPrice = window.prompt(
      "Enter the subscription price (e.g., $99):",
      ""
    );
    if (subscriptionPrice === null) return;
    const trainingCategory = window.prompt(
      "Enter the training category (e.g., Weight Loss):",
      ""
    );
    if (trainingCategory === null) return;
    try {
      await api.put(`/api/admin/users/${userId}/subscribe`, {
        subscriptionPlan: planDescription,
        subscriptionPrice,
        trainingCategory,
      });
      alert("Subscription updated successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating subscription plan:", error);
      alert("Failed to update subscription plan");
    }
  };

  const handleMessage = (userId: string) => {
    window.location.href = `/messages/conversation/${userId}`;
  };

  const filteredUsers = useMemo(() => {
    const nameQ = filters.name.trim().toLowerCase();
    const planQ = filters.plan.trim().toLowerCase();
    const ageQ = filters.age.trim();
    const bmiQ = filters.bmi; // '', 'green', 'yellow', 'red'

    return users.filter((u) => {
      if (nameQ) {
        const n = (u.name || "").toLowerCase();
        if (!n.includes(nameQ)) return false;
      }
      if (ageQ) {
        const ageVal = u.q_age ?? u.age;
        if (String(ageVal) !== ageQ) return false;
      }
      if (planQ) {
        const d = (u.diet_time || "").toLowerCase();
        if (!d.includes(planQ)) return false;
      }
      if (bmiQ) {
        const { category } = computeBMI(u);
        if (category !== bmiQ) return false;
      }
      return true;
    });
  }, [users, filters]);

  return (
    <div className="sp-container">
      <h1>Admin Dashboard</h1>

      <AddUserForm onCreated={fetchUsers} />
      <UserFilters filters={filters} onChange={setFilters} />

      <UsersTable
        users={filteredUsers}
        onDelete={handleDelete}
        onPlanUpdate={handlePlanUpdate}
        onMessage={handleMessage}
      />
    </div>
  );
};

export default AdminDashboard;
