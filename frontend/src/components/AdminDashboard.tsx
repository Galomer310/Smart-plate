// frontend/src/components/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./admin/admin.css";

import AddUserForm from "./admin/AddUserForm";
import UserFilters, { type Filters } from "./admin/UserFillters";
import UsersTable from "./admin/UsearsTable";

import type { DashboardResponse, User } from "./admin/types";
import { computeBMI } from "./admin/bmi";

type Thread = {
  other_id: string;
  unread_count: number;
  // (other fields exist but we only need these two here)
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    age: "",
    plan: "",
    bmi: "",
  });

  // Map of userId -> unread count (for coloring the per-row Message button)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const adminToken = localStorage.getItem("adminToken");

  const fetchUsers = async () => {
    const r = await api.get<DashboardResponse>("/api/admin/dashboard");
    setUsers(r.data.users ?? []);
  };

  // Fetch admin’s message threads to know which user has unread messages
  const fetchUnreadThreads = async () => {
    if (!adminToken) return;
    const r = await api.get<{ threads: Thread[] }>("/api/messages/threads", {
      headers: { Authorization: `Bearer ${adminToken}` }, // force admin token for /messages/*
    });
    const next: Record<string, number> = {};
    for (const t of r.data.threads || []) {
      const other = t.other_id;
      const unread = Number(t.unread_count ?? 0);
      if (other && unread > 0) next[other] = unread;
    }
    setUnreadMap(next);
  };

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login", { replace: true });
      return;
    }
    (async () => {
      try {
        await fetchUsers();
        await fetchUnreadThreads();
      } catch (e) {
        console.error("Error loading dashboard:", e);
        alert("Failed to load dashboard");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // Filter bar logic (Name, Age, Plan, BMI color)
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
        const d = (u.diet_time || u.subscription_plan || "").toLowerCase();
        if (!d.includes(planQ)) return false;
      }
      if (bmiQ) {
        const { color } = computeBMI(u);
        if (color !== bmiQ) return false;
      }
      return true;
    });
  }, [users, filters]);

  // After we create/delete, reload users + unread state
  const refetchAll = async () => {
    await fetchUsers();
    await fetchUnreadThreads();
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user ${userEmail}?`
    );
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      await refetchAll();
      alert("User deleted successfully");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  // kept for future use; not rendered in your table currently
  const handlePlanUpdate = async (
    userId: string,
    currentPlan: string | null
  ) => {
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
      await refetchAll();
      alert("Subscription updated successfully");
    } catch (error: any) {
      console.error("Error updating subscription plan:", error);
      alert("Failed to update subscription plan");
    }
  };

  // Open the admin-only messages page and pass name/email for header
  const handleMessage = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    navigate(`/admin/messages/${userId}`, {
      state: { name: u?.name ?? null, email: u?.email ?? null },
    });
  };

  return (
    <div className="sp-container">
      <h1>Admin Dashboard</h1>

      {/* Add new user */}
      <AddUserForm onCreated={refetchAll} />

      {/* Filters */}
      <UserFilters filters={filters} onChange={setFilters} />

      {/* Users table (unchanged UI) */}
      <UsersTable
        users={filteredUsers}
        onDelete={handleDelete}
        onPlanUpdate={handlePlanUpdate}
        onMessage={handleMessage}
        // NEW: provide unread map so each row can color its Message button
        unreadMap={unreadMap}
      />
    </div>
  );
};

export default AdminDashboard;
