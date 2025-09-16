import React, { useState } from "react";
import api from "../../api";

type Props = { onCreated: () => void };

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (d: number) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

const AddUserForm: React.FC<Props> = ({ onCreated }) => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    startDate: todayISO(),
    endDate: plusDaysISO(21),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, startDate, endDate } = newUser;

    if (!name || !email || !password || !startDate || !endDate) {
      alert("Please fill all fields.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("End date must be on/after start date");
      return;
    }

    try {
      await api.post("/api/admin/users", {
        name,
        email,
        password,
        startDate,
        endDate,
      });
      alert("User created successfully");
      setNewUser({
        name: "",
        email: "",
        password: "",
        startDate: todayISO(),
        endDate: plusDaysISO(21),
      });
      onCreated();
    } catch (error: any) {
      console.error("Error creating user:", error?.response?.data || error);
      alert(error?.response?.data?.error || "Failed to create user");
    }
  };

  return (
    <div className="sp-card">
      <h2 style={{ marginTop: 0 }}>Add New User</h2>

      {/* Keep the same grid; just span dates to full width below the first row */}
      <form
        onSubmit={handleSubmit}
        className="sp-grid"
        style={{ gap: "0.75rem" }}
      >
        {/* First row */}
        <input
          className="sp-input"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          className="sp-input"
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <input
          className="sp-input"
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        />

        {/* Start date: full width, under first row */}
        <div style={{ gridColumn: "1 / -1", marginTop: "0.25rem" }}>
          <small style={{ marginBottom: 4, color: "#555", display: "block" }}>
            Start date
          </small>
          <input
            className="sp-input"
            type="date"
            value={newUser.startDate || ""}
            onChange={(e) =>
              setNewUser({ ...newUser, startDate: e.target.value })
            }
            aria-label="Start date"
            style={{ width: "50%" }}
          />
        </div>

        {/* End date: full width, on its own line */}
        <div style={{ gridColumn: "1 / -1" }}>
          <small style={{ marginBottom: 4, color: "#555", display: "block" }}>
            End date
          </small>
          <input
            className="sp-input"
            type="date"
            value={newUser.endDate || ""}
            min={newUser.startDate || undefined}
            onChange={(e) =>
              setNewUser({ ...newUser, endDate: e.target.value })
            }
            aria-label="End date"
            style={{ width: "50%" }}
          />
        </div>

        <button
          type="submit"
          className="sp-btn"
          style={{ gridColumn: "1 / -1" }}
        >
          Create User
        </button>
      </form>
    </div>
  );
};

export default AddUserForm;
