import React, { useMemo, useState } from "react";
import api from "../../api";

type Props = { onCreated: () => void };

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (d: number) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

const pwdPolicy = /^(?=.*\d)(?=.*[^\w\s]).{8,64}$/; // UPDATED
const emailPolicy = /^\S+@\S+\.\S+$/;

const AddUserForm: React.FC<Props> = ({ onCreated }) => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    startDate: todayISO(),
    endDate: plusDaysISO(21),
  });

  const emailValid = useMemo(
    () => emailPolicy.test(newUser.email),
    [newUser.email]
  );
  const passwordValid = useMemo(
    () => pwdPolicy.test(newUser.password),
    [newUser.password]
  );

  const datesValid = useMemo(() => {
    const s = new Date(newUser.startDate);
    const e = new Date(newUser.endDate);
    return !Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && s <= e;
  }, [newUser.startDate, newUser.endDate]);

  const canSubmit =
    newUser.name.trim().length > 0 && emailValid && passwordValid && datesValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      alert("Please fix validation errors before submitting.");
      return;
    }

    try {
      await api.post("/api/admin/users", {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        startDate: newUser.startDate,
        endDate: newUser.endDate,
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

      <form
        onSubmit={handleSubmit}
        className="sp-grid"
        style={{ gap: "0.75rem" }}
      >
        {/* First row: Name / Email / Password */}
        <div>
          <input
            className="sp-input"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <small style={{ display: "block", marginTop: 4, color: "#666" }}>
            Full name (letters/spaces). / שם מלא
          </small>
        </div>

        <div>
          <input
            className="sp-input"
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <small
            style={{
              display: "block",
              marginTop: 4,
              color: emailValid ? "#3a7" : "#b00020",
            }}
          >
            Use a valid email like <em>user@example.com</em>. / כתובת מייל תקינה
          </small>
        </div>

        <div>
          <input
            className="sp-input"
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />
          <small
            style={{
              display: "block",
              marginTop: 4,
              color: passwordValid ? "#3a7" : "#b00020",
            }}
          >
            8–64 chars, include a number and a symbol. / סיסמה באורך 8–64 תווים
            עם ספרה אחת ותו מיוחד אחד
          </small>
        </div>

        {/* Start date: full width, below first row */}
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
            style={{ width: "100%" }}
          />
          <small style={{ display: "block", marginTop: 4, color: "#666" }}>
            Format: YYYY-MM-DD. / תבנית תאריך: YYYY-MM-DD
          </small>
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
            style={{ width: "100%" }}
          />
          <small
            style={{
              display: "block",
              marginTop: 4,
              color: datesValid ? "#3a7" : "#b00020",
            }}
          >
            Must be the same or after the start date. / חייב להיות מאוחר או שווה
            לתאריך ההתחלה
          </small>
        </div>

        <button
          type="submit"
          className="sp-btn"
          style={{ gridColumn: "1 / -1" }}
          disabled={!canSubmit}
        >
          Create User
        </button>
      </form>
    </div>
  );
};

export default AddUserForm;
