import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "./types";
import { computeBMI } from "./bmi";

type Props = {
  users: User[];
  onDelete: (id: string, email: string) => void;
  onPlanUpdate: (id: string, currentPlan: string | null) => void;
  onMessage: (id: string) => void;
};

const UsersTable: React.FC<Props> = ({
  users,
  onDelete,
  onPlanUpdate,
  onMessage,
}) => {
  const navigate = useNavigate();
  const [detailsUser, setDetailsUser] = useState<User | null>(null);

  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {/* ID removed. Height/Weight removed. */}
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Name</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Age</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Goal</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>BMI</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Diet Time</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const ageToShow = u.q_age ?? u.age;
            const goalToShow = u.program_goal ?? "—";
            const { bmi, label, color } = computeBMI(u);
            const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

            return (
              <tr key={u.id}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {u.name || "—"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {ageToShow}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {goalToShow}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 8,
                    background: color,
                    fontWeight: 600,
                  }}
                >
                  {bmiDisplay}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {u.diet_time || "N/A"}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => onDelete(u.id, u.email)}
                    style={{ padding: "0.5rem", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      onPlanUpdate(u.id, u.subscription_plan ?? null)
                    }
                    style={{ padding: "0.5rem", cursor: "pointer" }}
                  >
                    {u.subscription_plan ? "Edit Plan" : "Choose a Plan"}
                  </button>
                  <button
                    onClick={() => onMessage(u.id)}
                    style={{ padding: "0.5rem", cursor: "pointer" }}
                  >
                    Message
                  </button>
                  <button
                    onClick={() => navigate(`/plans-constructor/${u.id}`)}
                    style={{ padding: "0.5rem", cursor: "pointer" }}
                  >
                    Add Work Out Plan
                  </button>
                  <button
                    onClick={() => setDetailsUser(u)}
                    style={{ padding: "0.5rem", cursor: "pointer" }}
                  >
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Details Dialog (includes ID + full questionnaire, plus BMI row) */}
      {detailsUser && (
        <div
          onClick={() => setDetailsUser(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              maxWidth: 900,
              width: "95%",
              padding: 16,
              borderRadius: 8,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Details – {detailsUser.email}</h3>

            {(() => {
              const { bmi, label, color } = computeBMI(detailsUser);
              const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;
              return (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {/* ID now only in details */}
                    <tr>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 8,
                          fontWeight: 600,
                          width: 240,
                        }}
                      >
                        ID
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 8 }}>
                        {detailsUser.id}
                      </td>
                    </tr>

                    {/* BMI row */}
                    <tr>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 8,
                          fontWeight: 600,
                          width: 240,
                        }}
                      >
                        BMI (18.5–24.9 Normal)
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 8,
                          background: color,
                          fontWeight: 600,
                        }}
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
                          style={{
                            border: "1px solid #ddd",
                            padding: 8,
                            fontWeight: 600,
                            width: 240,
                          }}
                        >
                          {k as string}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {String(v ?? "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={() => setDetailsUser(null)}
                style={{ padding: "0.5rem 0.8rem" }}
              >
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
