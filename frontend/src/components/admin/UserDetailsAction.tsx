import React, { useState } from "react";
import type { User } from "./types";
import { computeBMI } from "./bmi";

/**
 * Renders a "Details" button and, when clicked, shows the user details modal.
 * Keeps the same UI, fields, and BMI logic you previously had inline.
 */
type Props = {
  user: User;
  buttonLabel?: string;
  className?: string; // e.g., "sp-btn"
};

const UserDetailsAction: React.FC<Props> = ({
  user,
  buttonLabel = "Details",
  className = "sp-btn",
}) => {
  const [open, setOpen] = useState(false);

  const { bmi, label, color } = computeBMI(user);
  const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>

      {open && (
        <div className="sp-modal-overlay" onClick={() => setOpen(false)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Details – {user.email}</h3>

            <table className="sp-table" style={{ minWidth: 0 }}>
              <tbody>
                <tr>
                  <td className="sp-td" style={{ fontWeight: 600, width: 240 }}>
                    ID
                  </td>
                  <td className="sp-td">{user.id}</td>
                </tr>
                <tr>
                  <td className="sp-td" style={{ fontWeight: 600, width: 240 }}>
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
                  ["Diet start", (user as any).diet_start_date ?? "—"],
                  ["Diet end", (user as any).diet_end_date ?? "—"],
                  [
                    "גובה",
                    (user as any).height ?? (user as any).height_profile,
                  ],
                  [
                    "משקל",
                    (user as any).weight ?? (user as any).weight_profile,
                  ],
                  ["גיל", (user as any).q_age ?? (user as any).age],
                  ["אלרגיות/רגישויות", (user as any).allergies],
                  ["מטרת התוכנית", (user as any).program_goal],
                  ["מה תרצי לשפר", (user as any).body_improvement],
                  ["בעיות רפואיות", (user as any).medical_issues],
                  ["נוטלת תרופות", (user as any).takes_medications],
                  ["הריון/אחרי לידה", (user as any).pregnant_or_postpartum],
                  ["תסמיני גיל המעבר", (user as any).menopause_symptoms],
                  ["ארוחת בוקר קבועה", (user as any).breakfast_regular],
                  ["עצירויות/נפיחות/עיכול", (user as any).digestion_issues],
                  ["נשנוש בין ארוחות", (user as any).snacking_between_meals],
                  ["אכילה מסודרת ביום", (user as any).organized_eating],
                  ["הימנעות מקבוצות מזון", (user as any).avoid_food_groups],
                  ["מים ביום", (user as any).water_intake],
                  ["תזונה", (user as any).diet_type],
                  ["פעילות גופנית סדירה", (user as any).regular_activity],
                  ["תדירות אימונים", (user as any).training_frequency],
                  ["סוג פעילות", (user as any).activity_type],
                  ["תחושה כללית", (user as any).body_feeling],
                  ["שעות שינה רצופות", (user as any).sleep_hours],
                  [
                    "נשלח בתאריך",
                    (user as any).submitted_at?.slice(0, 19)?.replace("T", " "),
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

            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button className="sp-btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetailsAction;
