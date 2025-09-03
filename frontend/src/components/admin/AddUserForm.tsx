import React, { useState } from "react";
import api from "../../api";

type Props = {
  onCreated: () => void;
};

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
        onSubmit={handleSubmit}
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
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        />
        <input
          placeholder="Diet time (e.g., 12 weeks)"
          value={newUser.dietTime}
          onChange={(e) => setNewUser({ ...newUser, dietTime: e.target.value })}
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
  );
};

export default AddUserForm;
