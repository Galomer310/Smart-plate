import type { User } from "./types";

export function parseNum(v?: string | number | null): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^\d.,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}

export function metersFromHeight(v?: string | number | null): number | null {
  const n = parseNum(v);
  if (n == null) return null;
  if (n > 3) return n / 100;         // assume centimeters like "170"
  if (n > 0 && n < 3.5) return n;    // meters like "1.70"
  return null;
}

export function computeBMI(u: User): {
  bmi: number | null;
  label: "Under" | "Normal" | "Above" | "—";
  color: string;               // background color
  category: "yellow" | "green" | "red" | "none"; // for filtering
} {
  const h = metersFromHeight(u.height ?? u.height_profile);
  const w = parseNum(u.weight ?? u.weight_profile);
  if (!h || !w) return { bmi: null, label: "—", color: "transparent", category: "none" };

  const bmiVal = w / (h * h);
  const bmi = Math.round(bmiVal * 10) / 10;

  if (bmi < 18.5) return { bmi, label: "Under",  color: "#fff3cd", category: "yellow" };
  if (bmi <= 24.9) return { bmi, label: "Normal", color: "#d4edda", category: "green"  };
  return                { bmi, label: "Above",  color: "#f8d7da", category: "red"    };
}
