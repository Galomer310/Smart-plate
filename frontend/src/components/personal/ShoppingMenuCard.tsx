import React from "react";
import type { MealSelections } from "./PlatePlanner";

type MealRow = { selections: MealSelections; savedAt: string };

type Props = {
  meals: {
    breakfast?: MealRow;
    lunch?: MealRow;
    dinner?: MealRow;
  };
  onEdit?: (which: "breakfast" | "lunch" | "dinner") => void;
};

const NOTES: string[] = [
  "היכן שלא רשום מידע הכוונה היא ליחידה אחת",
  "המלצה לאכול עד 3 פירות ביום.",
  "טחינה יש לאכול לסירוגין יום כן ויום לא.",
  "טונה לסירוגין יום כן ויום לא.",
  "קייל – להקפיץ קלות.",
  "ביצים עד 3 ביום.",
  "בוק צ׳וי – להקפיץ לפני האכילה.",
  "בכל מנת יוגורט 180 גרם.",
  "גבינת עיזים רכה – עד 3 כפות ביום.",
  "גבינת פטה עיזים – עד 30 גרם.",
  "לטבעוניים: לקבלת חלבון מלא – לצרף למנת הקינואה את גרגירי החומוס.",
  "מים – לשתות מינימום 2.5 ליטר ביום.",
  "המלצה: בבוקר לשתות כוס מים עם קורט מלח ים אטלנטי או הימאליה.",
  "המלצה: בתום הארוחה להמתין כשעה לפני שתיית קפה/תה.",
  "צ׳יאה – להשרות ברבע כוס מים 5 דקות, לערבב ולאכול (כפית).",
];

const SectionList: React.FC<{
  title: string;
  items?: MealSelections;
  when?: string;
  onEdit?: () => void;
}> = ({ title, items, when, onEdit }) => {
  return (
    <div className="sp-card" style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <strong>{title}</strong>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {when && (
            <span style={{ opacity: 0.6 }}>
              {new Date(when).toLocaleString()}
            </span>
          )}
          {items && onEdit && (
            <button className="sp-badge" onClick={onEdit} title="עריכה">
              עריכה
            </button>
          )}
        </div>
      </div>
      {!items ? (
        <div style={{ opacity: 0.6 }}>טרם נשמרה צלחת</div>
      ) : (
        <>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              פחמימות (50%)
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <div>
                <b>עלים ירוקים:</b> {items.carbs.greens.join(", ") || "—"}
              </div>
              <div>
                <b>ירקות ירוקים:</b> {items.carbs.greenVeg.join(", ") || "—"}
              </div>
              <div>
                <b>ירקות אדומים:</b> {items.carbs.redVeg.join(", ") || "—"}
              </div>
              <div>
                <b>פירות + בונוס:</b>{" "}
                {items.carbs.fruitsBonus.join(", ") || "—"}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>חלבון (40%)</div>
            <div>{items.protein.join(", ") || "—"}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>שומן (10%)</div>
            <div>{items.fat.join(", ") || "—"}</div>
          </div>
        </>
      )}
    </div>
  );
};

const ShoppingMenuCard: React.FC<Props> = ({ meals, onEdit }) => {
  const [tab, setTab] = React.useState<"notes" | "menu">("notes");

  return (
    <div className="sp-card" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="sp-badge"
          onClick={() => setTab("notes")}
          style={tab === "notes" ? { fontWeight: 800 } : undefined}
        >
          הערות
        </button>
        <button
          className="sp-badge"
          onClick={() => setTab("menu")}
          style={tab === "menu" ? { fontWeight: 800 } : undefined}
        >
          תפריט (ארוחות שנשמרו)
        </button>
      </div>

      {tab === "notes" ? (
        <div className="sp-card" style={{ background: "#fff" }}>
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>
            {NOTES.map((n, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {n}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <SectionList
            title="ארוחת בוקר"
            items={meals.breakfast?.selections}
            when={meals.breakfast?.savedAt}
            onEdit={onEdit ? () => onEdit("breakfast") : undefined}
          />
          <SectionList
            title="ארוחת צהריים"
            items={meals.lunch?.selections}
            when={meals.lunch?.savedAt}
            onEdit={onEdit ? () => onEdit("lunch") : undefined}
          />
          <SectionList
            title="ארוחת ערב"
            items={meals.dinner?.selections}
            when={meals.dinner?.savedAt}
            onEdit={onEdit ? () => onEdit("dinner") : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default ShoppingMenuCard;
