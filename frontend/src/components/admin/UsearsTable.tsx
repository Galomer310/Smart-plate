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
  unreadMap?: Record<string, number>; // userId -> unread count
};

// small helpers
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

const UsersTable: React.FC<Props> = ({
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
            const ageToShow =
              firstDefined(u, ["age", "q_age", "user_age"]) ?? "—";
            const goalToShow =
              firstDefined(u, ["program_goal", "goal", "user_goal"]) ?? "—";

            const { bmi, label, color } = computeBMI(u);
            const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

            const start =
              firstDefined(u, ["diet_start_date", "dietStartDate"]) ?? null;
            const end =
              firstDefined(u, ["diet_end_date", "dietEndDate"]) ?? null;

            const unread = Number(unreadMap?.[u.id] ?? 0);
            const hasUnread = unread > 0;

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

                    {/* SOLID RED when specific user has unread */}
                    <button
                      className="sp-btn"
                      aria-label={
                        hasUnread
                          ? `Unread from ${u.name}`
                          : `Message ${u.name}`
                      }
                      onClick={() => onMessage(u.id)}
                      style={
                        hasUnread
                          ? {
                              background: "#d32f2f",
                              color: "#fff",
                              borderColor: "#d32f2f",
                              fontWeight: 700,
                            }
                          : undefined
                      }
                      title={hasUnread ? `Unread (${unread})` : "Message"}
                    >
                      Message{hasUnread ? ` (${unread})` : ""}
                    </button>

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

export default UsersTable;
