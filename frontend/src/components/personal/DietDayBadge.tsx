import React from "react";
import type { PlanInfo } from "./types";
import "./personal.css";

type Props = { plan: PlanInfo | null };

const DietDayBadge: React.FC<Props> = ({ plan }) => {
  if (!plan) return null;

  const todayDietDay = Number.isFinite(plan.todayDietDay as any)
    ? Number(plan.todayDietDay)
    : 0;
  const dietDays = Number.isFinite(plan.dietDays as any)
    ? Number(plan.dietDays)
    : 0;
  const expired = !!plan.expired;

  // Build label defensively
  let label = "הדיאטה טרם החלה";
  if (todayDietDay > 0 && dietDays > 0) {
    label =
      todayDietDay <= dietDays
        ? `יום דיאטה ${todayDietDay} / ${dietDays}`
        : `יום דיאטה ${todayDietDay} / ${dietDays} (הסתיים)`;
  }

  const bg = todayDietDay <= 0 ? "#eef1ff" : expired ? "#fdecea" : "#e7f5e7";

  return (
    <div className="sp-card" style={{ background: bg }}>
      <div className="sp-badge">{label}</div>
      {expired && (
        <div style={{ marginTop: 8, color: "#b00020" }}>
          המנוי הסתיים. נא לפנות למנהל להארכה.
        </div>
      )}
    </div>
  );
};

export default DietDayBadge;
