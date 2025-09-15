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

  // Map userId -> unread count (for Message button coloring)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const adminToken = localStorage.getItem("adminToken");

  const fetchUsers = async () => {
    const r = await api.get<DashboardResponse>("/api/admin/dashboard");
    setUsers(r.data.users ?? []);
  };

  const fetchUnreadThreads = async () => {
    if (!adminToken) return;
    const r = await api.get<{ threads: Thread[] }>("/api/messages/threads", {
      headers: { Authorization: `Bearer ${adminToken}` }, // force admin token for messages API
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

  // Filters (Name, Age, Plan/Diet time, BMI color)
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

  const handlePlanUpdate = async (_id: string, _currentPlan: string | null) => {
    // kept for future use; not rendered in the table currently
  };

  const handleMessage = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    navigate(`/admin/messages/${userId}`, {
      state: { name: u?.name ?? null, email: u?.email ?? null },
    });
  };

  const handleMeals = (userId: string) => {
    navigate(`/admin/meals/${userId}`);
  };

  return (
    <div className="sp-container">
      <h1>Admin Dashboard</h1>

      <AddUserForm onCreated={refetchAll} />

      <UserFilters filters={filters} onChange={setFilters} />

      <UsersTable
        users={filteredUsers}
        onDelete={handleDelete}
        onPlanUpdate={handlePlanUpdate}
        onMessage={handleMessage}
        onMeals={handleMeals}
        unreadMap={unreadMap}
      />
    </div>
  );
};

export default AdminDashboard;
