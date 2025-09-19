import React, { useEffect, useState } from "react";
import type { User } from "./types";
import { computeBMI } from "./bmi";
import api from "../../api";

type Props = {
  user: User; // row object from /admin/dashboard
  buttonLabel?: string;
  className?: string; // e.g., "sp-btn"
};

function firstDefined<T = any>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return undefined;
}

function fmtDateTime(x?: any): string {
  if (!x) return "—";
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? String(x) : d.toLocaleString();
}
function fmtDateOnly(x?: any): string {
  if (!x) return "—";
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? String(x) : d.toLocaleDateString();
}

const UserDetailsAction: React.FC<Props> = ({
  user,
  buttonLabel = "Details",
  className = "sp-btn",
}) => {
  const [open, setOpen] = useState(false);

  // We will fetch a full record when modal opens:
  const [details, setDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const adminToken = localStorage.getItem("adminToken");

  const loadDetails = async (id: string) => {
    setLoading(true);
    try {
      const r = await api.get<{ user: any }>(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }, // ensure admin role
      });
      setDetails(r.data.user);
    } catch (e: any) {
      console.error("Failed to load user details:", e?.response?.data || e);
      setDetails(null);
      alert(e?.response?.data?.error || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  // Open → fetch details
  useEffect(() => {
    if (open && user?.id) loadDetails(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  // Prefer the fetched details; fall back to row if still loading
  const data = details || user;

  // BMI computed on the *richest* data available
  const { bmi, label, color } = computeBMI(data);
  const bmiDisplay = bmi === null ? "—" : `${bmi} (${label})`;

  const dietStart = firstDefined(data, ["diet_start_date", "dietStartDate"]);
  const dietEnd = firstDefined(data, ["diet_end_date", "dietEndDate"]);

  const fields: Array<[string, any]> = [
    ["Diet start", fmtDateOnly(dietStart)],
    ["Diet end", fmtDateOnly(dietEnd)],

    // Anthropometrics (covers questionnaire + profile)
    [
      "גובה",
      firstDefined(data, [
        "height",
        "height_profile",
        "q_height",
        "user_height",
      ]),
    ],
    [
      "משקל",
      firstDefined(data, [
        "weight",
        "weight_profile",
        "q_weight",
        "user_weight",
      ]),
    ],
    ["גיל", firstDefined(data, ["age", "q_age", "user_age"])],

    // Questionnaire block (now present thanks to /users/:id)
    ["אלרגיות/רגישויות", firstDefined(data, ["allergies", "q_allergies"])],
    ["מטרת התוכנית", firstDefined(data, ["program_goal", "goal"])],
    ["מה תרצי לשפר", firstDefined(data, ["body_improvement"])],
    ["בעיות רפואיות", firstDefined(data, ["medical_issues"])],
    ["נוטלת תרופות", firstDefined(data, ["takes_medications"])],
    ["הריון/אחרי לידה", firstDefined(data, ["pregnant_or_postpartum"])],
    ["תסמיני גיל המעבר", firstDefined(data, ["menopause_symptoms"])],
    ["ארוחת בוקר קבועה", firstDefined(data, ["breakfast_regular"])],
    ["עצירויות/נפיחות/עיכול", firstDefined(data, ["digestion_issues"])],
    ["נשנוש בין ארוחות", firstDefined(data, ["snacking_between_meals"])],
    ["אכילה מסודרת ביום", firstDefined(data, ["organized_eating"])],
    ["הימנעות מקבוצות מזון", firstDefined(data, ["avoid_food_groups"])],
    ["מים ביום (ל׳)", firstDefined(data, ["water_intake"])],
    ["תזונה", firstDefined(data, ["diet_type"])],
    ["פעילות גופנית סדירה", firstDefined(data, ["regular_activity"])],
    ["מתאמנת איפה", firstDefined(data, ["training_place"])],
    ["תדירות אימונים", firstDefined(data, ["training_frequency"])],
    ["סוג פעילות", firstDefined(data, ["activity_type"])],
    ["תחושה כללית", firstDefined(data, ["body_feeling"])],
    ["שעות שינה רצופות", firstDefined(data, ["sleep_hours"])],
    [
      "נשלח בתאריך",
      fmtDateTime(firstDefined(data, ["submitted_at", "submittedAt"])),
    ],
  ];

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>

      {open && (
        <div className="sp-modal-overlay" onClick={() => setOpen(false)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>
              Details – {data.email ?? data.name ?? data.id}
            </h3>

            {/* Top: ID + BMI */}
            <table className="sp-table" style={{ minWidth: 0 }}>
              <tbody>
                <tr>
                  <td className="sp-td" style={{ fontWeight: 600, width: 240 }}>
                    ID
                  </td>
                  <td className="sp-td">{data.id}</td>
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

                {/* All other fields */}
                {loading ? (
                  <tr>
                    <td className="sp-td" colSpan={2}>
                      Loading full details…
                    </td>
                  </tr>
                ) : (
                  fields.map(([label, value]) => (
                    <tr key={label}>
                      <td
                        className="sp-td"
                        style={{ fontWeight: 600, width: 240 }}
                      >
                        {label}
                      </td>
                      <td className="sp-td">
                        {value !== undefined &&
                        value !== null &&
                        String(value) !== ""
                          ? String(value)
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
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
