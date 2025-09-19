// frontend/src/components/admin/UsearsTable.tsx
import React from "react";
import type { User } from "./types";
import { computeBMI } from "./bmi";
import UserDetailsAction from "./UserDetailsAction";

type Props = {
  users: User[];
  onDelete: (id: string, email: string) => void;
  onPlanUpdate?: (id: string, currentPlan: string | null) => void;
  onMessage: (id: string) => void;
  onMeals?: (id: string) => void;
  unreadMap?: Record<string, number>;
};

// --- helpers -----------------------------------------------------------------

function firstDefined<T = any>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return undefined;
}

function toDateish(input: any): Date | null {
  if (!input) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    // fast path YYYY-MM-DD
    const [y, m, d] = input.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const dt = new Date(input);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDateDDMMYYYY(input: any): string {
  const dt = toDateish(input);
  if (!dt) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

// -----------------------------------------------------------------------------

const UserTable: React.FC<Props> = ({
  users,
  onDelete,
  onMessage,
  onMeals,
  unreadMap,
}) => {
  return (
    <div className="sp-table-wrapper">
      <table className="sp-table">
        <thead>
          <tr>
            <th className="sp-th">Name</th>
            <th className="sp-th">Age</th>
            <th className="sp-th">Goal</th>
            <th className="sp-th">BMI</th>
            <th className="sp-th">Diet Dates</th>
            <th className="sp-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            // Age & Goal: tolerate DB/profile/questionnaire differences
            const ageToShow =
              firstDefined(u, ["age", "q_age", "user_age"]) ?? "—";
            const goalToShow =
              firstDefined(u, ["program_goal", "goal", "user_goal"]) ?? "—";

            // BMI using robust helper (handles meter/cm + multiple keys)
            const { bmi, label, color } = computeBMI(u);
            const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

            // Diet dates: accept both snake_case and camelCase
            const start =
              firstDefined(u, ["diet_start_date", "dietStartDate"]) ?? null;
            const end =
              firstDefined(u, ["diet_end_date", "dietEndDate"]) ?? null;

            const hasUnread = !!unreadMap && (unreadMap[u.id] ?? 0) > 0;

            return (
              <tr key={u.id}>
                <td className="sp-td">{u.name || "—"}</td>
                <td className="sp-td">{ageToShow}</td>
                <td className="sp-td">{goalToShow}</td>
                <td
                  className="sp-td"
                  style={{ background: color, fontWeight: 600 }}
                >
                  {bmiDisplay}
                </td>

                {/* Diet start (top) / Diet end (bottom) */}
                <td className="sp-td">
                  {start || end ? (
                    <div style={{ display: "grid", gap: 4, lineHeight: 1.2 }}>
                      <div>{formatDateDDMMYYYY(start)}</div>
                      <div>{formatDateDDMMYYYY(end)}</div>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>

                <td className="sp-td">
                  <div className="sp-actions">
                    <button
                      className="sp-btn"
                      onClick={() => onDelete(u.id, u.email)}
                    >
                      Delete
                    </button>

                    <button
                      className="sp-btn"
                      onClick={() => onMessage(u.id)}
                      title={hasUnread ? "Unread messages" : "Message"}
                      style={
                        hasUnread
                          ? {
                              background: "#ffeaea",
                              color: "#b00020",
                              borderColor: "#f4b1b4",
                            }
                          : undefined
                      }
                    >
                      Message
                    </button>

                    {/* The Details button + modal */}
                    <UserDetailsAction user={u} className="sp-btn" />

                    {onMeals && (
                      <button className="sp-btn" onClick={() => onMeals(u.id)}>
                        Meals
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
