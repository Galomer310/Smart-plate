import React, { useMemo, useState, useEffect } from "react";
import api from "../../api";
import RoundPlate from "./RoundPlate";

export type CarbsGroups = {
  greens: string[]; // עלים ירוקים
  greenVeg: string[]; // ירקות ירוקים
  redVeg: string[]; // ירקות אדומים
  fruitsBonus: string[]; // פירות + בונוס
};

export type MealSelections = {
  carbs: CarbsGroups;
  protein: string[];
  fat: string[];
};

type Props = {
  mode: "create" | "edit";
  editingMeal?: "breakfast" | "lunch" | "dinner";
  initial?: MealSelections | null;
  onCancelEdit?: () => void;
  onSaved: (
    mealName: "breakfast" | "lunch" | "dinner" | null,
    meal: MealSelections
  ) => void;
  // when mode=create → mealName is null (parent decides the next slot)
};

// === Categorized options (Hebrew) ===
// 1) Carbs 50% subdivided:
const CARBS_GREENS = [
  "פטרוזיליה",
  "כוסברה",
  "סלרי",
  "נענע",
  "חסה",
  "בזיליקום",
  "תרד",
  "עלי ביבי",
  "קייל",
  "מנגולד",
  "רוקט",
  "שמיר",
  "בוק צ'וי",
  "חמציץ",
  "בצל ירוק",
  "אורגנו",
  "עירית",
  "נבטים - חופן",
  "סלק ירוק",
  "גרגר הנחלים - חופן",
];

const CARBS_GREEN_VEG = [
  "אפונה הגינה - 150 גרם",
  "שועית ירוקה - 150 גרם",
  "זוקיני",
  "קישוא",
  "מלפפון",
  "ברוקולי",
  "דלורית",
  "קולורבי",
  "כרוב ניצנים",
  "אספרגוס",
  "במיה",
  "לפט",
  "ארטישוק ירושלמי",
];

const CARBS_RED_VEG = [
  "סלק אדום",
  "עגבניה",
  "פלפל",
  "גמבה",
  "גזר",
  "דלעת",
  "תירס",
  "חציל",
  "כרובית",
  "בצל",
  "שום",
  "צנון",
  "צנונית",
  "ארטישוק",
];

const CARBS_FRUITS_BONUS = [
  "תפוח ירוק חמוץ - גראנדסמייט",
  "אגס",
  "בננה",
  "תפוז",
  "קלמנטינה",
  "פירות יער - כוס",
  "לימון",
  "אשכולית",
  "פומלה",
  "אבטיח - 1/8",
  "שזיף",
  "אפרסק",
  "דובדבן - 6 יחידות",
  "תות שדה - 8 יחידות",
  "קיווי - יחידה",
  "רימון - רבע",
  "פטל - 6 יחידות",
  "אוכמניות - עד 20 יחידות",
  // בונוס נוספים שהגדרת
  "פטריות",
  "חציל",
  "כרובית",
  "אספרגוס",
  "ארטישוק",
  "צנון",
  "צנונית",
  "לפט",
  "רימון",
  "תפוז",
  "זיתים",
  // פחמימות עמילניות המתאימות (כמו קודם)
  "בטטה - עד 3 כפות",
  "קינואה - 2 כפות",
  "כוסמת ירוקה - 2 כפות",
  "גרגירי חומוס - כף ביום",
];

// 2) Protein 40%
const PROTEIN_OPTIONS = [
  "ביצים - עד 3 ביום",
  "גבינת עזים 5%",
  "פטה עיזים 5%",
  "יוגורט קפיר (180 גרם)",
  "יוגורט עיזים 5% (180 גרם)",
  "בשר אדום רזה - 200 גרם",
  "דגי ים - 200 גרם",
  "הודו - 200 גרם",
  "עוף - 200 גרם",
  "טופו - 200 גרם",
  "טופו משי - 2 כפות",
  "סרדינים בשימורים - 150 גרם",
  "טונה בשימורים - 150 גרם",
  "אדממה - 150 גרם",
];

// 3) Fat 10%
const FAT_OPTIONS = [
  "שמן זית כתית בכבישה קרה - כף אחת ביום",
  "טחינה - כפית (לסרוגין)",
  "אבוקדו - רבע עד חצי",
  "זיתים - 4",
  "צ'יאה (מושרה) - כפית",
  "פשתן טחון - כפית",
];

const emptyCarbs: CarbsGroups = {
  greens: [],
  greenVeg: [],
  redVeg: [],
  fruitsBonus: [],
};

const PlatePlanner: React.FC<Props> = ({
  mode,
  editingMeal,
  initial,
  onCancelEdit,
  onSaved,
}) => {
  const [carbs, setCarbs] = useState<CarbsGroups>(initial?.carbs ?? emptyCarbs);
  const [protein, setProtein] = useState<string[]>(initial?.protein ?? []);
  const [fat, setFat] = useState<string[]>(initial?.fat ?? []);

  useEffect(() => {
    if (mode === "edit" && initial) {
      setCarbs(initial.carbs);
      setProtein(initial.protein);
      setFat(initial.fat);
    }
  }, [mode, initial]);

  const canSave =
    carbs.greens.length +
      carbs.greenVeg.length +
      carbs.redVeg.length +
      carbs.fruitsBonus.length >
      0 &&
    protein.length > 0 &&
    fat.length > 0;

  const toggle = (
    list: string[],
    setter: (v: string[]) => void,
    item: string
  ) => {
    setter(
      list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
    );
  };

  const save = async () => {
    if (!canSave) return;

    const payload = { carbs, protein, fat };

    // Decide meal target:
    // - edit mode: send to the meal we're editing
    // - create mode: parent will decide next slot; we pass null
    const targetMeal: "breakfast" | "lunch" | "dinner" | null =
      mode === "edit" ? editingMeal ?? null : null;

    if (targetMeal) {
      await api.post(`/api/user/meals/${targetMeal}`, {
        carbs,
        protein,
        fat,
      });
    }
    onSaved(targetMeal, payload);

    if (mode === "create") {
      // reset for next plate
      setCarbs(emptyCarbs);
      setProtein([]);
      setFat([]);
    }
  };

  return (
    <div className="sp-card" style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h3 style={{ margin: 0 }}>
          {mode === "edit" ? "עריכת צלחת" : "צלחת היומית"}
        </h3>
        <RoundPlate />
      </div>

      {/* Carbs groups */}
      <div className="sp-card" style={{ background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>פחמימות (50%)</div>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>עלים ירוקים</div>
            <div className="sp-list-grid">
              {CARBS_GREENS.map((item) => (
                <label key={item} className="sp-check">
                  <input
                    type="checkbox"
                    checked={carbs.greens.includes(item)}
                    onChange={() =>
                      setCarbs({
                        ...carbs,
                        greens: toggleRet(carbs.greens, item),
                      })
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>ירקות ירוקים</div>
            <div className="sp-list-grid">
              {CARBS_GREEN_VEG.map((item) => (
                <label key={item} className="sp-check">
                  <input
                    type="checkbox"
                    checked={carbs.greenVeg.includes(item)}
                    onChange={() =>
                      setCarbs({
                        ...carbs,
                        greenVeg: toggleRet(carbs.greenVeg, item),
                      })
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>ירקות אדומים</div>
            <div className="sp-list-grid">
              {CARBS_RED_VEG.map((item) => (
                <label key={item} className="sp-check">
                  <input
                    type="checkbox"
                    checked={carbs.redVeg.includes(item)}
                    onChange={() =>
                      setCarbs({
                        ...carbs,
                        redVeg: toggleRet(carbs.redVeg, item),
                      })
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              פירות + בונוס
            </div>
            <div className="sp-list-grid">
              {CARBS_FRUITS_BONUS.map((item) => (
                <label key={item} className="sp-check">
                  <input
                    type="checkbox"
                    checked={carbs.fruitsBonus.includes(item)}
                    onChange={() =>
                      setCarbs({
                        ...carbs,
                        fruitsBonus: toggleRet(carbs.fruitsBonus, item),
                      })
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Protein */}
      <div className="sp-card" style={{ background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>חלבון (40%)</div>
        <div className="sp-list-grid">
          {PROTEIN_OPTIONS.map((item) => (
            <label key={item} className="sp-check">
              <input
                type="checkbox"
                checked={protein.includes(item)}
                onChange={() => toggle(protein, setProtein, item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fat */}
      <div className="sp-card" style={{ background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>שומן (10%)</div>
        <div className="sp-list-grid">
          {FAT_OPTIONS.map((item) => (
            <label key={item} className="sp-check">
              <input
                type="checkbox"
                checked={fat.includes(item)}
                onChange={() => toggle(fat, setFat, item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {mode === "edit" && (
          <button className="sp-badge" type="button" onClick={onCancelEdit}>
            ביטול
          </button>
        )}
        <button className="sp-badge" disabled={!canSave} onClick={save}>
          {mode === "edit" ? "שמור שינויים" : "שמור צלחת"}
        </button>
      </div>
    </div>
  );
};

export default PlatePlanner;

// helper to return new array without mutating original
function toggleRet(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
