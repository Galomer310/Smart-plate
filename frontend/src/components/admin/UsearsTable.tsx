import React, { useState } from "react";
import type { User } from "./types";
import { computeBMI } from "./bmi";

type Props = {
  users: User[];
  onDelete: (id: string, email: string) => void;
  onPlanUpdate: (id: string, currentPlan: string | null) => void;
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

const UsersTable: React.FC<Props> = ({
  users,
  onDelete,
  onMessage,
  onMeals,
  unreadMap,
}) => {
  const [detailsUser, setDetailsUser] = useState<User | null>(null);

  return (
    <>
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
              const dietRange =
                start && end
                  ? `start: '${formatDateDDMMYYYY(
                      start
                    )}' →  end: '${formatDateDDMMYYYY(end)}'`
                  : "N/A";

              const hasUnread = !!unreadMap && unreadMap[u.id] > 0;

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
                  <td className="sp-td">{dietRange}</td>
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

                      <button
                        className="sp-btn"
                        onClick={() => setDetailsUser(u)}
                      >
                        Details
                      </button>

                      {onMeals && (
                        <button
                          className="sp-btn"
                          onClick={() => onMeals(u.id)}
                        >
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

      {/* Details Modal (unchanged except dates are shown in table; modal keeps full info) */}
      {detailsUser && (
        <div className="sp-modal-overlay" onClick={() => setDetailsUser(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Details – {detailsUser.email}</h3>
            {(() => {
              const { bmi, label, color } = computeBMI(detailsUser);
              const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;
              return (
                <table className="sp-table" style={{ minWidth: 0 }}>
                  <tbody>
                    <tr>
                      <td
                        className="sp-td"
                        style={{ fontWeight: 600, width: 240 }}
                      >
                        ID
                      </td>
                      <td className="sp-td">{detailsUser.id}</td>
                    </tr>
                    <tr>
                      <td
                        className="sp-td"
                        style={{ fontWeight: 600, width: 240 }}
                      >
                        BMI (18.5–24.9 Normal)
                      </td>
                      <td
                        className="sp-td"
                        style={{ background: color, fontWeight: 600 }}
                      >
                        {bmiDisplay}
                      </td>
                    </tr>
                    {[
                      [
                        "Diet start",
                        (detailsUser as any).diet_start_date ?? "—",
                      ],
                      ["Diet end", (detailsUser as any).diet_end_date ?? "—"],
                      [
                        "גובה",
                        (detailsUser as any).height ??
                          (detailsUser as any).height_profile,
                      ],
                      [
                        "משקל",
                        (detailsUser as any).weight ??
                          (detailsUser as any).weight_profile,
                      ],
                      [
                        "גיל",
                        (detailsUser as any).q_age ?? (detailsUser as any).age,
                      ],
                      ["אלרגיות/רגישויות", (detailsUser as any).allergies],
                      ["מטרת התוכנית", (detailsUser as any).program_goal],
                      ["מה תרצי לשפר", (detailsUser as any).body_improvement],
                      ["בעיות רפואיות", (detailsUser as any).medical_issues],
                      ["נוטלת תרופות", (detailsUser as any).takes_medications],
                      [
                        "הריון/אחרי לידה",
                        (detailsUser as any).pregnant_or_postpartum,
                      ],
                      [
                        "תסמיני גיל המעבר",
                        (detailsUser as any).menopause_symptoms,
                      ],
                      [
                        "ארוחת בוקר קבועה",
                        (detailsUser as any).breakfast_regular,
                      ],
                      [
                        "עצירויות/נפיחות/עיכול",
                        (detailsUser as any).digestion_issues,
                      ],
                      [
                        "נשנוש בין ארוחות",
                        (detailsUser as any).snacking_between_meals,
                      ],
                      [
                        "אכילה מסודרת ביום",
                        (detailsUser as any).organized_eating,
                      ],
                      [
                        "הימנעות מקבוצות מזון",
                        (detailsUser as any).avoid_food_groups,
                      ],
                      ["מים ביום", (detailsUser as any).water_intake],
                      ["תזונה", (detailsUser as any).diet_type],
                      [
                        "פעילות גופנית סדירה",
                        (detailsUser as any).regular_activity,
                      ],
                      [
                        "תדירות אימונים",
                        (detailsUser as any).training_frequency,
                      ],
                      ["סוג פעילות", (detailsUser as any).activity_type],
                      ["תחושה כללית", (detailsUser as any).body_feeling],
                      ["שעות שינה רצופות", (detailsUser as any).sleep_hours],
                      [
                        "נשלח בתאריך",
                        (detailsUser as any).submitted_at
                          ?.slice(0, 19)
                          ?.replace("T", " "),
                      ],
                    ].map(([k, v]) => (
                      <tr key={String(k)}>
                        <td
                          className="sp-td"
                          style={{ fontWeight: 600, width: 240 }}
                        >
                          {k as string}
                        </td>
                        <td className="sp-td">{String(v ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button className="sp-btn" onClick={() => setDetailsUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersTable;
