import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  name?: string;
  height?: string;
  weight?: string;
  age: number;
  subscription_plan?: string;
  subscription_price?: string;
  training_category?: string;
  diet_time?: string;
  unread_count?: number;
  last_feedback?: string;
}

type DashboardResponse = { users: User[] };

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    id: "",
    name: "",
    email: "",
    height: "",
    weight: "",
    age: "",
    plan: "",
    category: "",
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    dietTime: "",
  });

  const adminToken = localStorage.getItem("adminToken");
  const navigate = useNavigate();

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredUsers = users.filter((user) => {
    const matchId = filters.id ? String(user.id).includes(filters.id) : true;
    const matchName = filters.name
      ? (user.name || "").toLowerCase().includes(filters.name.toLowerCase())
      : true;
    const matchEmail = filters.email
      ? user.email.toLowerCase().includes(filters.email.toLowerCase())
      : true;
    const matchHeight = filters.height
      ? (user.height || "").toString().includes(filters.height)
      : true;
    const matchWeight = filters.weight
      ? (user.weight || "").toString().includes(filters.weight)
      : true;
    const matchAge = filters.age
      ? String(user.age).includes(filters.age)
      : true;
    const matchPlan = filters.plan
      ? (user.subscription_plan || "")
          .toLowerCase()
          .includes(filters.plan.toLowerCase())
      : true;
    const matchCategory = filters.category
      ? (user.training_category || "")
          .toLowerCase()
          .includes(filters.category.toLowerCase())
      : true;
    return (
      matchId &&
      matchName &&
      matchEmail &&
      matchHeight &&
      matchWeight &&
      matchAge &&
      matchPlan &&
      matchCategory
    );
  });

  const handleMessage = (userId: string) => {
    navigate(`/messages/conversation/${userId}`);
  };

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password, dietTime } = newUser;
    if (!name || !email || !password || !dietTime) {
      alert("Please fill all fields.");
      return;
    }

    try {
      await api.post("/api/admin/users", {
        name,
        email,
        password,
        dietTime,
      });
      alert("User created successfully");
      setNewUser({ name: "", email: "", password: "", dietTime: "" });
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error?.response?.data || error);
      alert(error?.response?.data?.error || "Failed to create user");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Admin Dashboard</h1>

      {/* Create User Panel */}
      <div
        style={{
          margin: "1rem 0",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add New User</h2>
        <form
          onSubmit={handleCreateUser}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
          }}
        >
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />
          <input
            placeholder="Diet time (e.g., 12 weeks)"
            value={newUser.dietTime}
            onChange={(e) =>
              setNewUser({ ...newUser, dietTime: e.target.value })
            }
          />
          <button
            type="submit"
            style={{
              gridColumn: "span 4",
              padding: "0.6rem",
              cursor: "pointer",
            }}
          >
            Create User
          </button>
        </form>
      </div>

      {/* Filters */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <input
          name="id"
          placeholder="Filter by ID"
          value={filters.id}
          onChange={handleFilterChange}
        />
        <input
          name="name"
          placeholder="Filter by Name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          name="email"
          placeholder="Filter by Email"
          value={filters.email}
          onChange={handleFilterChange}
        />
        <input
          name="height"
          placeholder="Filter by Height"
          value={filters.height}
          onChange={handleFilterChange}
        />
        <input
          name="weight"
          placeholder="Filter by Weight"
          value={filters.weight}
          onChange={handleFilterChange}
        />
        <input
          name="age"
          placeholder="Filter by Age"
          value={filters.age}
          onChange={handleFilterChange}
        />
        <input
          name="plan"
          placeholder="Filter by Plan"
          value={filters.plan}
          onChange={handleFilterChange}
        />
        <input
          name="category"
          placeholder="Filter by Category"
          value={filters.category}
          onChange={handleFilterChange}
        />
      </div>

      {/* Users Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Height</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Weight</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Age</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Plan</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Price</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Category
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Diet Time
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Last Feedback
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user: User) => (
            <tr key={user.id}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.id}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.name || "—"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.email}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.height || "—"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.weight || "—"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.age}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.subscription_plan || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.subscription_price || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.training_category || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.diet_time || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.last_feedback || "None"}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <button
                  onClick={() => handleDelete(user.id, user.email)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    handlePlanUpdate(user.id, user.subscription_plan ?? null)
                  }
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  {user.subscription_plan ? "Edit Plan" : "Choose a Plan"}
                </button>
                <button
                  onClick={() => handleMessage(user.id)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Message
                </button>
                <button
                  onClick={() => navigate(`/plans-constructor/${user.id}`)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Add Work Out Plan
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
