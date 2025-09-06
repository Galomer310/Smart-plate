import React, { useState } from "react";
import type { User } from "./types";
import { computeBMI } from "./bmi";

type Props = {
  users: User[];
  onDelete: (id: string, email: string) => void;
  onPlanUpdate: (id: string, currentPlan: string | null) => void; // kept for future, not rendered
  onMessage: (id: string) => void;
  unreadMap?: Record<string, number>; // <-- NEW: map userId -> unread count
};

const UsersTable: React.FC<Props> = ({
  users,
  onDelete,
  onMessage,
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
              <th className="sp-th">Diet Time</th>
              <th className="sp-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const ageToShow = u.q_age ?? u.age;
              const goalToShow = u.program_goal ?? "—";
              const { bmi, label, color } = computeBMI(u);
              const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

              const hasUnread = !!unreadMap && unreadMap[u.id] > 0;

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
                  <td className="sp-td">{u.diet_time || "N/A"}</td>
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
                        // Red background when there are unread messages from this user
                        style={
                          hasUnread
                            ? {
                                background: "#ffeaea",
                                color: "#b00020",
                                borderColor: "#f4b1b4",
                              }
                            : undefined
                        }
                        title={hasUnread ? "Unread messages" : "Message"}
                      >
                        Message
                      </button>
                      <button
                        className="sp-btn"
                        onClick={() => setDetailsUser(u)}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
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
                        "גובה",
                        detailsUser.height ?? detailsUser.height_profile,
                      ],
                      [
                        "משקל",
                        detailsUser.weight ?? detailsUser.weight_profile,
                      ],
                      ["גיל", detailsUser.q_age ?? detailsUser.age],
                      ["אלרגיות/רגישויות", detailsUser.allergies],
                      ["מטרת התוכנית", detailsUser.program_goal],
                      ["מה תרצי לשפר", detailsUser.body_improvement],
                      ["בעיות רפואיות", detailsUser.medical_issues],
                      ["נוטלת תרופות", detailsUser.takes_medications],
                      ["הריון/אחרי לידה", detailsUser.pregnant_or_postpartum],
                      ["תסמיני גיל המעבר", detailsUser.menopause_symptoms],
                      ["ארוחת בוקר קבועה", detailsUser.breakfast_regular],
                      ["עצירויות/נפיחות/עיכול", detailsUser.digestion_issues],
                      ["נשנוש בין ארוחות", detailsUser.snacking_between_meals],
                      ["אכילה מסודרת ביום", detailsUser.organized_eating],
                      ["הימנעות מקבוצות מזון", detailsUser.avoid_food_groups],
                      ["מים ביום", detailsUser.water_intake],
                      ["תזונה", detailsUser.diet_type],
                      ["פעילות גופנית סדירה", detailsUser.regular_activity],
                      ["תדירות אימונים", detailsUser.training_frequency],
                      ["סוג פעילות", detailsUser.activity_type],
                      ["תחושה כללית", detailsUser.body_feeling],
                      ["שעות שינה רצופות", detailsUser.sleep_hours],
                      [
                        "נשלח בתאריך",
                        detailsUser.submitted_at
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
