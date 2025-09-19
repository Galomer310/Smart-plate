// frontend/src/components/personal/PlanHeader.tsx
import React, { useMemo } from "react";
import type { PlanInfo } from "./types";
import PlanCalendar from "./PlanCalender";
import DietDayBadge from "./DietDayBadge";
import "./personal.css";

/** Robust date parser used across components */
function parseDate(input?: any): Date | null {
  if (!input) return null;
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input;

  if (typeof input === "string") {
    const iso = new Date(input);
    if (!Number.isNaN(iso.getTime()))
      return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());

    const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const dd = Number(m[1]),
        mm = Number(m[2]) - 1,
        yyyy = Number(m[3]);
      const d = new Date(yyyy, mm, dd);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

type Props = { plan: PlanInfo | null };

const PlanHeader: React.FC<Props> = ({ plan }) => {
  const enroll = parseDate(plan?.enrollDate);
  const start = parseDate(plan?.startDate);
  const end = parseDate(plan?.endDate);

  const fmt = (d: Date | null) => (d ? d.toLocaleDateString() : "—");

  // Derive todayDietDay / dietDays / expired when missing
  const derived = useMemo(() => {
    const today = new Date();
    const dayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    let todayDietDay: number | null = null;
    let dietDays: number | null = null;
    let expired = false;

    if (start && end && end >= start) {
      const diffFromStart =
        Math.floor((dayOnly.getTime() - start.getTime()) / 86400000) + 1; // inclusive day 1
      todayDietDay = diffFromStart;
      dietDays =
        Math.floor(
          (new Date(
            end.getFullYear(),
            end.getMonth(),
            end.getDate()
          ).getTime() -
            new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate()
            ).getTime()) /
            86400000
        ) + 1;
      expired = dayOnly.getTime() > end.getTime();
    }
    return { todayDietDay, dietDays, expired };
  }, [plan?.startDate, plan?.endDate]);

  const normalizedPlan: PlanInfo | null = plan
    ? {
        ...plan,
        todayDietDay: plan.todayDietDay ?? derived.todayDietDay ?? 0,
        dietDays: plan.dietDays ?? derived.dietDays ?? 0,
        expired: plan.expired ?? derived.expired ?? false,
      }
    : null;

  return (
    <div className="sp-plan-header">
      {/* Top card: badge + dates */}
      <div>
        <DietDayBadge plan={normalizedPlan} />
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
              <strong>תאריך הרשמה:</strong> {fmt(enroll)}
            </div>
            <div>
              <strong>התחלת תוכנית:</strong> {fmt(start)}
            </div>
            <div>
              <strong>סיום תוכנית:</strong> {fmt(end)}
            </div>
          </div>
          {/* Messages button removed – use Navbar instead */}
        </div>
      </div>

      {/* Calendar */}
      <div className="sp-card">
        <h3 style={{ marginTop: 0 }}>לוח זמנים</h3>
        <PlanCalendar plan={normalizedPlan} />
      </div>
    </div>
  );
};

export default PlanHeader;
