import React from "react";
import type { User } from "./types";
import { computeBMI } from "./bmi";
import UserDetailsAction from "./UserDetailsAction";

type Props = {
  users: User[];
  onDelete: (id: string, email: string) => void;
  onPlanUpdate?: (id: string, currentPlan: string | null) => void; // kept for API parity with your other actions
  onMessage: (id: string) => void;
  onMeals?: (id: string) => void;
  unreadMap?: Record<string, number>;
};

function formatDateDDMMYYYY(input: any): string {
  if (!input) return "—";
  // If DB gives "YYYY-MM-DD"
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-");
    return `${d}.${m}.${y}`;
  }
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return String(input);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

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
            const ageToShow = (u as any).q_age ?? u.age;
            const goalToShow = (u as any).program_goal ?? "—";
            const { bmi, label, color } = computeBMI(u);
            const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

            const start = (u as any).diet_start_date;
            const end = (u as any).diet_end_date;

            const hasUnread = !!unreadMap && (unreadMap[u.id] ?? 0) > 0;

            return (
              <tr key={u.id}>
                <td className="sp-td">{u.name || "—"}</td>
                <td className="sp-td">{ageToShow ?? "—"}</td>
                <td className="sp-td">{goalToShow}</td>
                <td
                  className="sp-td"
                  style={{ background: color, fontWeight: 600 }}
                >
                  {bmiDisplay}
                </td>

                {/* Diet Dates: start on top line, end on bottom line */}
                <td className="sp-td">
                  {start || end ? (
                    <div style={{ display: "grid", gap: 4, lineHeight: 1.2 }}>
                      <div>{start ? formatDateDDMMYYYY(start) : "—"}</div>
                      <div>{end ? formatDateDDMMYYYY(end) : "—"}</div>
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

                    {/* Details action moved to its own component */}
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
