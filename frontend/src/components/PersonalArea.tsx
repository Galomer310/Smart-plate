import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

type Questionnaire = {
  height: string; // store as string (e.g., "1.70")
  weight: string; // store as string (e.g., "70")
  age: string; // input as string, backend coerces to number (20-90)

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
  const [loading, setLoading] = useState(true);
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Build dropdown option arrays
  // Height: 1.40 -> 2.10 in 0.01 m steps (≈ 71 options). Change STEP to 0.05/0.10 if you want fewer.
  const HEIGHT_MIN = 1.4;
  const HEIGHT_MAX = 2.1;
  const HEIGHT_STEP = 0.01;

  const heightOptions = useMemo(() => {
    const arr: string[] = [];
    for (
      let h = Math.round(HEIGHT_MIN * 100);
      h <= Math.round(HEIGHT_MAX * 100);
      h += Math.round(HEIGHT_STEP * 100)
    ) {
      arr.push((h / 100).toFixed(2));
    }
    return arr;
  }, []);

  // Weight: 45 -> 200 (step 1)
  const weightOptions = useMemo(() => {
    const arr: string[] = [];
    for (let w = 45; w <= 200; w++) arr.push(String(w));
    return arr;
  }, []);

  // Age: 20 -> 90 (step 1)
  const ageOptions = useMemo(() => {
    const arr: string[] = [];
    for (let a = 20; a <= 90; a++) arr.push(String(a));
    return arr;
  }, []);

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

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<QuestionnaireGet>("/api/user/questionnaire");
        if (!r.data.exists) setNeedsQuestionnaire(true);
      } catch (e: any) {
        console.error("Failed to check questionnaire:", e);
        // If check fails (likely auth), show the questionnaire to avoid blocking the user
        setNeedsQuestionnaire(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set =
    (k: keyof Questionnaire) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // basic client-side guardrails before hitting the server
    if (!form.height) return setErrorMsg("בחרי גובה מהרשימה.");
    if (!form.weight) return setErrorMsg("בחרי משקל מהרשימה.");
    if (!form.age) return setErrorMsg("בחרי גיל מהרשימה.");

    try {
      await api.post("/api/user/questionnaire", {
        ...form,
        // backend coerces age to number; we still send a string here and let zod coerce
      });

      alert("השאלון נשמר בהצלחה!");
      setNeedsQuestionnaire(false);
    } catch (e: any) {
      console.error("Failed to submit questionnaire:", e);
      const msg =
        e?.response?.data?.error || e?.message || "אירעה שגיאה בשמירת השאלון";
      setErrorMsg(msg);
      alert(msg);
    }
  };

  if (loading) return <div style={{ padding: "1rem" }}>טוען...</div>;

  if (needsQuestionnaire) {
    return (
      <div style={{ padding: "1rem", direction: "rtl" }}>
        <h1>שאלון פתיחה</h1>
        {errorMsg && (
          <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>
        )}
        <form
          onSubmit={submit}
          style={{ display: "grid", gap: "0.75rem", maxWidth: 900 }}
        >
          {/* Height / Weight / Age dropdowns */}
          <label>
            גובה
            <select value={form.height} onChange={set("height")}>
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
            <select value={form.weight} onChange={set("weight")}>
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
            <select value={form.age} onChange={set("age")}>
              <option value="">בחרי...</option>
              {ageOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          {/* The rest (free text / yes-no) */}
          <textarea
            placeholder="אלרגיות ו/או רגישויות"
            value={form.allergies}
            onChange={set("allergies")}
          />
          <textarea
            placeholder="מטרת התוכנית"
            value={form.program_goal}
            onChange={set("program_goal")}
          />
          <textarea
            placeholder="מה תרצי לשפר בגופך"
            value={form.body_improvement}
            onChange={set("body_improvement")}
          />
          <textarea
            placeholder="האם יש לך בעיות רפואיות"
            value={form.medical_issues}
            onChange={set("medical_issues")}
          />
          <textarea
            placeholder="האם את נוטלת תרופות אם כן צייני את שם התרופה וכמות יומית"
            value={form.takes_medications}
            onChange={set("takes_medications")}
          />
          <textarea
            placeholder="האם את בהריון או אחרי לידה (עד חצי שנה)"
            value={form.pregnant_or_postpartum}
            onChange={set("pregnant_or_postpartum")}
          />
          <textarea
            placeholder="האם יש לך תסמינים של גיל המעבר אם כן צייני"
            value={form.menopause_symptoms}
            onChange={set("menopause_symptoms")}
          />
          <input
            placeholder="האם את אוכלת ארוחת בוקר באופן קבוע"
            value={form.breakfast_regular}
            onChange={set("breakfast_regular")}
          />
          <input
            placeholder="האם את סובלת מ- עצירויות / נפיחות בטנית / בעיות בעיכול"
            value={form.digestion_issues}
            onChange={set("digestion_issues")}
          />
          <input
            placeholder="האם את מנשנשת בין הארוחות "
            value={form.snacking_between_meals}
            onChange={set("snacking_between_meals")}
          />
          <input
            placeholder="האם את אוכלת באופן מסודר בדרך כלל במהלך היום? בוקר / צהרים / ערב"
            value={form.organized_eating}
            onChange={set("organized_eating")}
          />
          <textarea
            placeholder="האם את נמנעת מאכילת קבוצות מזון כלשהן פחמימות/חלבונים/שומנים/אחר"
            value={form.avoid_food_groups}
            onChange={set("avoid_food_groups")}
          />
          <input
            placeholder="צייני מהי כמות המים שאת שותה ביום בכוסות או בליטרים "
            value={form.water_intake}
            onChange={set("water_intake")}
          />
          <input
            placeholder="האם את צמחונית / טבעונית / קרניבורית / אחר "
            value={form.diet_type}
            onChange={set("diet_type")}
          />
          <input
            placeholder="האם את מתאמנת באופן קבוע ? אם כן צייני את סוג הפעילות "
            value={form.regular_activity}
            onChange={set("regular_activity")}
          />

          <input
            placeholder="כמה פעמים בשבוע את מתאמנת"
            value={form.training_frequency}
            onChange={set("training_frequency")}
          />
          <textarea
            placeholder="צייני בבקשה מהי התחושה הכללית שלך כלפי גופך כיום "
            value={form.body_feeling}
            onChange={set("body_feeling")}
          />
          <input
            placeholder="כמה שעות רצופות בלילה את ישנה"
            value={form.sleep_hours}
            onChange={set("sleep_hours")}
          />

          <button
            type="submit"
            style={{ padding: "0.6rem", cursor: "pointer" }}
          >
            שליחה
          </button>
        </form>
      </div>
    );
  }

  // Regular personal area after first submission
  return (
    <div style={{ padding: "1rem" }}>
      <h1>אזור אישי</h1>
      <p>ברוכה הבאה! השאלון הושלם. כאן יוצגו התוכנית/הודעות וכו'.</p>
    </div>
  );
};

export default PersonalArea;
