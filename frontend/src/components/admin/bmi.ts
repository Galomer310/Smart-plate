// frontend/src/components/admin/bmi.ts
// A robust BMI helper that tolerates different field names and units.
// It safely parses height/weight from multiple possible keys (snake_case/camelCase)
// and returns a normalized BMI result for UI consumption.

export type BMIResult = {
  bmi: number | null;      // e.g., 23.4 or null if unavailable
  label: string;           // "Underweight", "Normal", "Overweight", "Obese", or "N/A"
  color: string;           // background color suggestion for the cell
};

// ---- internal helpers -------------------------------------------------------

function firstDefined<T = any>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function toNumber(x: any): number | null {
  if (x === undefined || x === null) return null;
  const s = String(x).replace(/[^\d.\-]/g, ""); // strip non-numeric (keeps dot/minus)
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseHeightMeters(raw: any): number | null {
  // Accepts meters ("1.70") or centimeters ("170" or "170 cm")
  const n = toNumber(raw);
  if (n === null) return null;
  if (n > 3) {
    // assume centimeters if suspiciously large
    return n / 100;
  }
  return n; // already meters
}

function parseWeightKg(raw: any): number | null {
  // Accepts kg ("70" or "70 kg")
  const n = toNumber(raw);
  return n === null ? null : n;
}

// ---- main -------------------------------------------------------------------

export function computeBMI(user: any): BMIResult {
  // Try many possible keys (DB, profile, questionnaire)
  const heightRaw =
    firstDefined(user, ["height", "height_profile", "q_height", "user_height"]) ??
    firstDefined(user, ["Height", "HeightProfile"]);
  const weightRaw =
    firstDefined(user, ["weight", "weight_profile", "q_weight", "user_weight"]) ??
    firstDefined(user, ["Weight", "WeightProfile"]);

  const h = parseHeightMeters(heightRaw);
  const w = parseWeightKg(weightRaw);

  if (!h || !w || h <= 0 || w <= 0) {
    return { bmi: null, label: "N/A", color: "#f5f5f5" };
  }

  const bmi = Number((w / (h * h)).toFixed(1));

  // WHO categories
  if (bmi < 18.5) return { bmi, label: "Underweight", color: "#FFF3CD" }; // yellow
  if (bmi < 25)   return { bmi, label: "Normal",      color: "#D7F7D7" }; // green
  if (bmi < 30)   return { bmi, label: "Overweight",  color: "#FFE0B2" }; // orange
  return                 { bmi, label: "Obese",       color: "#F8D7DA" }; // red
}
