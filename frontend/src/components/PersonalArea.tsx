// frontend/src/components/PersonalArea.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import PlanHeader from "./personal/PlanHeader";
import type { PlanInfo } from "./personal/types";
import "./personal/personal.css";

type Questionnaire = {
  height: string;
  weight: string;
  age: string;

  allergies: string;
  program_goal: string;
  body_improvement: string;
  medical_issues: string;
  takes_medications: string;
  pregnant_or_postpartum: string;
  menopause_symptoms: string;
  breakfast_regular: string;
  digestion_issues: string;
  snacking_between_meals: string;
  organized_eating: string;
  avoid_food_groups: string;
  water_intake: string;
  diet_type: string;
  regular_activity: string;
  training_place: string;
  training_frequency: string;
  activity_type: string;
  body_feeling: string;
  sleep_hours: string;
};

type QuestionnaireGet = { exists: boolean; data?: Partial<Questionnaire> };

const PersonalArea: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropdown options
  const heightOptions = useMemo(() => {
    const arr: string[] = [];
    for (let h = 140; h <= 210; h++) arr.push((h / 100).toFixed(2));
    return arr;
  }, []);
  const weightOptions = useMemo(() => {
    const arr: string[] = [];
    for (let w = 45; w <= 200; w++) arr.push(String(w));
    return arr;
  }, []);
  const ageOptions = useMemo(() => {
    const arr: string[] = [];
    for (let a = 20; a <= 90; a++) arr.push(String(a));
    return arr;
  }, []);

  // Questionnaire form state
  const [form, setForm] = useState<Questionnaire>({
    height: "",
    weight: "",
    age: "",
    allergies: "",
    program_goal: "",
    body_improvement: "",
    medical_issues: "",
    takes_medications: "",
    pregnant_or_postpartum: "",
    menopause_symptoms: "",
    breakfast_regular: "",
    digestion_issues: "",
    snacking_between_meals: "",
    organized_eating: "",
    avoid_food_groups: "",
    water_intake: "",
    diet_type: "",
    regular_activity: "",
    training_place: "",
    training_frequency: "",
    activity_type: "",
    body_feeling: "",
    sleep_hours: "",
  });

  const setField =
    (k: keyof Questionnaire) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const loadStatus = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await api.get<QuestionnaireGet>("/api/user/questionnaire");
      const exists = r.data.exists === true;
      setNeedsQuestionnaire(!exists);

      if (exists) {
        try {
          const planRes = await api.get<PlanInfo>("/api/user/plan");
          setPlan(planRes.data);
        } catch (e) {
          console.error("Failed to load plan:", e);
          setPlan(null);
        }
      } else {
        setPlan(null);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        // Not authenticated → go to login; do NOT show the questionnaire
        navigate("/login");
        return;
      }
      // Network/other error → show retry UI; do NOT show the questionnaire
      setLoadError(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to check questionnaire status"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.height) return setErrorMsg("בחרי גובה מהרשימה.");
    if (!form.weight) return setErrorMsg("בחרי משקל מהרשימה.");
    if (!form.age) return setErrorMsg("בחרי גיל מהרשימה.");

    try {
      await api.post("/api/user/questionnaire", { ...form });
      // Re-check on server to confirm it now exists
      await loadStatus();
      alert("השאלון נשמר בהצלחה!");
    } catch (e: any) {
      console.error("Failed to submit questionnaire:", e);
      const msg =
        e?.response?.data?.error || e?.message || "אירעה שגיאה בשמירת השאלון";
      setErrorMsg(msg);
      alert(msg);
    }
  };

  if (loading) return <div className="sp-personal">טוען...</div>;

  if (loadError) {
    return (
      <div className="sp-personal">
        <div className="sp-card" style={{ color: "#b00020" }}>
          {loadError}
        </div>
        <button className="sp-badge" onClick={loadStatus}>
          נסה שוב
        </button>
      </div>
    );
  }

  if (needsQuestionnaire) {
    return (
      <div className="sp-personal" style={{ direction: "rtl" }}>
        <h1>שאלון פתיחה</h1>
        {errorMsg && (
          <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>
        )}

        <form
          onSubmit={submitQuestionnaire}
          className="sp-card"
          style={{ display: "grid", gap: "0.75rem", maxWidth: 900 }}
        >
          {/* Height / Weight / Age dropdowns */}
          <label>
            גובה
            <select
              className="sp-select"
              value={form.height}
              onChange={setField("height")}
            >
              <option value="">בחרי...</option>
              {heightOptions.map((h) => (
                <option key={h} value={h}>
                  {h} מ'
                </option>
              ))}
            </select>
          </label>

          <label>
            משקל
            <select
              className="sp-select"
              value={form.weight}
              onChange={setField("weight")}
            >
              <option value="">בחרי...</option>
              {weightOptions.map((w) => (
                <option key={w} value={w}>
                  {w} ק״ג
                </option>
              ))}
            </select>
          </label>

          <label>
            גיל
            <select
              className="sp-select"
              value={form.age}
              onChange={setField("age")}
            >
              <option value="">בחרי...</option>
              {ageOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          {/* Rest of fields */}
          <textarea
            className="sp-textarea"
            placeholder="אלרגיות ו/או רגישויות"
            value={form.allergies}
            onChange={setField("allergies")}
          />
          <textarea
            className="sp-textarea"
            placeholder="מטרת התוכנית"
            value={form.program_goal}
            onChange={setField("program_goal")}
          />
          <textarea
            className="sp-textarea"
            placeholder="מה תרצי לשפר בגופך"
            value={form.body_improvement}
            onChange={setField("body_improvement")}
          />
          <textarea
            className="sp-textarea"
            placeholder="האם יש לך בעיות רפואיות"
            value={form.medical_issues}
            onChange={setField("medical_issues")}
          />
          <textarea
            className="sp-textarea"
            placeholder="האם נוטלת תרופות"
            value={form.takes_medications}
            onChange={setField("takes_medications")}
          />
          <textarea
            className="sp-textarea"
            placeholder="האם בהריון או אחרי לידה (עד חצי שנה)"
            value={form.pregnant_or_postpartum}
            onChange={setField("pregnant_or_postpartum")}
          />
          <textarea
            className="sp-textarea"
            placeholder="האם יש תסמינים של גיל המעבר"
            value={form.menopause_symptoms}
            onChange={setField("menopause_symptoms")}
          />
          <input
            className="sp-input"
            placeholder="האם את אוכלת ארוחת בוקר באופן קבוע"
            value={form.breakfast_regular}
            onChange={setField("breakfast_regular")}
          />
          <input
            className="sp-input"
            placeholder="עצירויות/נפיחות/בעיות עיכול"
            value={form.digestion_issues}
            onChange={setField("digestion_issues")}
          />
          <input
            className="sp-input"
            placeholder="נשנוש בין ארוחות"
            value={form.snacking_between_meals}
            onChange={setField("snacking_between_meals")}
          />
          <input
            className="sp-input"
            placeholder="אכילה מסודרת במהלך היום"
            value={form.organized_eating}
            onChange={setField("organized_eating")}
          />
          <textarea
            className="sp-textarea"
            placeholder="הימנעות מקבוצות מזון (פחמימות/שומן/חלב)"
            value={form.avoid_food_groups}
            onChange={setField("avoid_food_groups")}
          />
          <input
            className="sp-input"
            placeholder="כמות מים ביום (ליטר)"
            value={form.water_intake}
            onChange={setField("water_intake")}
          />
          <input
            className="sp-input"
            placeholder="צמחונית / טבעונית / קרניבורית"
            value={form.diet_type}
            onChange={setField("diet_type")}
          />
          <input
            className="sp-input"
            placeholder="פעילות גופנית סדירה?"
            value={form.regular_activity}
            onChange={setField("regular_activity")}
          />
          <input
            className="sp-input"
            placeholder="מתאמנת לבד או בחדר כושר?"
            value={form.training_place}
            onChange={setField("training_place")}
          />
          <input
            className="sp-input"
            placeholder="כמה פעמים בשבוע את מתאמנת"
            value={form.training_frequency}
            onChange={setField("training_frequency")}
          />
          <input
            className="sp-input"
            placeholder="סוג הפעילות שאת נוהגת לעשות"
            value={form.activity_type}
            onChange={setField("activity_type")}
          />
          <textarea
            className="sp-textarea"
            placeholder="התחושה הכללית שלך כלפי גופך כיום"
            value={form.body_feeling}
            onChange={setField("body_feeling")}
          />
          <input
            className="sp-input"
            placeholder="כמה שעות רצופות בלילה את ישנה"
            value={form.sleep_hours}
            onChange={setField("sleep_hours")}
          />

          <button
            type="submit"
            className="sp-badge"
            style={{ alignSelf: "start" }}
          >
            שליחה
          </button>
        </form>
      </div>
    );
  }

  // Questionnaire already submitted → show plan header
  return (
    <div className="sp-personal">
      <PlanHeader
        plan={plan}
        onOpenMessages={() => (window.location.href = "/messages")}
      />

      <div className="sp-card">
        <h3 style={{ marginTop: 0 }}>התוכנית האישית</h3>
        <p>כאן נציג בהמשך פרטי תוכנית, יומן אימונים/תזונה, קבצים ועוד.</p>
      </div>
    </div>
  );
};

export default PersonalArea;
