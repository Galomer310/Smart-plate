import React from "react";
import type { PlanInfo } from "./types";
import "./personal.css";

type Props = { plan: PlanInfo | null };

const DietDayBadge: React.FC<Props> = ({ plan }) => {
  if (!plan) return null;

  const { todayDietDay, dietDays, expired } = plan;
  const label =
    todayDietDay <= 0
      ? "הדיאטה טרם החלה"
      : todayDietDay <= dietDays
      ? `יום דיאטה ${todayDietDay} / ${dietDays}`
      : `יום דיאטה ${todayDietDay} / ${dietDays} (הסתיים)`;

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
