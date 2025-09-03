import React from "react";
import type { PlanInfo } from "./types";
import PlanCalendar from "./PlanCalender";
import DietDayBadge from "./DietDayBadge";
import "./personal.css";

type Props = {
  plan: PlanInfo | null;
  onOpenMessages?: () => void;
};

const PlanHeader: React.FC<Props> = ({ plan, onOpenMessages }) => {
  return (
    <div className="sp-plan-header">
      {/* Diet Day / quick actions */}
      <div>
        <DietDayBadge plan={plan} />
        <div
          className="sp-card"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div>
              <strong>תאריך הרשמה:</strong>{" "}
              {plan ? new Date(plan.enrollDate).toLocaleDateString() : "—"}
            </div>
            <div>
              <strong>התחלת תוכנית:</strong>{" "}
              {plan ? new Date(plan.startDate).toLocaleDateString() : "—"}
            </div>
            <div>
              <strong>סיום תוכנית:</strong>{" "}
              {plan ? new Date(plan.endDate).toLocaleDateString() : "—"}
            </div>
          </div>
          <button className="sp-badge" onClick={onOpenMessages}>
            הודעות
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="sp-card">
        <h3 style={{ marginTop: 0 }}>לוח זמנים</h3>
        <PlanCalendar plan={plan} />
      </div>
    </div>
  );
};

export default PlanHeader;
