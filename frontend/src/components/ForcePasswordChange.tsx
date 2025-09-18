import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";

const CHANGE_PASSWORD_ENDPOINT = "/api/auth/change-password";
const AFTER_CHANGE_REDIRECT = "/personal";

type NavState = { email?: string | null };

const ForcePasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as NavState;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New policy (language-agnostic): 8–64 chars, at least 1 digit and 1 symbol.
  const policy = useMemo(
    () => ({
      min: 8,
      max: 64,
      regex: /^(?=.*\d)(?=.*[^\w\s]).{8,64}$/,
    }),
    []
  );

  const isValid = policy.regex.test(password);
  const match = password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError(
        "Password does not meet requirements. / הסיסמה אינה עומדת בדרישות"
      );
      return;
    }
    if (!match) {
      setError("Passwords do not match. / הסיסמאות אינן תואמות");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(CHANGE_PASSWORD_ENDPOINT, { newPassword: password });
      alert("Password changed successfully! / הסיסמה הוחלפה בהצלחה!");
      navigate(AFTER_CHANGE_REDIRECT, { replace: true });
    } catch (err: any) {
      console.error("Change password failed:", err?.response?.data || err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to change password / שינוי הסיסמה נכשל";
      setError(msg);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sp-container" style={{ maxWidth: 720 }}>
      <div className="sp-card">
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>
          Change Your Password / החליפי סיסמה
        </h1>
        {state?.email && (
          <div style={{ marginBottom: 8, color: "#666" }}>{state.email}</div>
        )}

        <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
          <div>
            <strong>Instructions (English):</strong>
            <ul style={{ margin: "6px 0 0 18px" }}>
              <li>Choose a password between 8 and 64 characters.</li>
              <li>Include at least one number and one symbol.</li>
              <li>Avoid using your name, email, or birth date.</li>
            </ul>
          </div>
          <div dir="rtl">
            <strong>הנחיות (עברית):</strong>
            <ul style={{ margin: "6px 0 0 18px" }}>
              <li>בחרי סיסמה באורך 8–64 תווים.</li>
              <li>הסיסמה חייבת לכלול לפחות ספרה אחת ותו מיוחד אחד.</li>
              <li>אל תשתמשי בשם, באימייל או בתאריך הלידה שלך.</li>
            </ul>
          </div>
        </div>

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 10 }}
          noValidate
        >
          <label>
            New password / סיסמה חדשה
            <input
              type="password"
              className="sp-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password / אימות סיסמה
            <input
              type="password"
              className="sp-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>

          <div style={{ fontSize: 13, lineHeight: 1.4, color: "#555" }}>
            <div>
              {isValid
                ? "✓ Meets: 8–64 chars + number + symbol"
                : "• Must be 8–64 chars and include a number and a symbol"}
            </div>
            <div>{match ? "✓ Passwords match" : "• Passwords must match"}</div>
          </div>

          <button
            type="submit"
            className="sp-btn"
            disabled={!isValid || !match || submitting}
          >
            {submitting ? "Updating..." : "Update Password / עדכני סיסמה"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
