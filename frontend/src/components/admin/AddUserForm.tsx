import React, { useState } from "react";
import api from "../../api";

type Props = { onCreated: () => void };

const AddUserForm: React.FC<Props> = ({ onCreated }) => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    dietTime: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, dietTime } = newUser;
    if (!name || !email || !password || !dietTime) {
      alert("Please fill all fields.");
      return;
    }
    try {
      await api.post("/api/admin/users", { name, email, password, dietTime });
      alert("User created successfully");
      setNewUser({ name: "", email: "", password: "", dietTime: "" });
      onCreated();
    } catch (error: any) {
      console.error("Error creating user:", error?.response?.data || error);
      alert(error?.response?.data?.error || "Failed to create user");
    }
  };

  return (
    <div className="sp-card">
      <h2 style={{ marginTop: 0 }}>Add New User</h2>
      <form onSubmit={handleSubmit} className="sp-grid">
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
        <input
          className="sp-input"
          placeholder="Diet time (e.g., 12 weeks)"
          value={newUser.dietTime}
          onChange={(e) => setNewUser({ ...newUser, dietTime: e.target.value })}
        />
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
