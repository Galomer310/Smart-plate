import React, { useMemo } from "react";
import type { PlanInfo } from "./types";
import "./personal.css";

type Props = { plan: PlanInfo | null };

const toDateOnly = (iso?: string) => (iso ? new Date(iso) : null);
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diffDays = (a: Date, b: Date) =>
  Math.floor(
    (new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
      new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) /
      86400000
  );

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

const chunk = <T,>(arr: T[], size: number) =>
  arr.reduce<T[][]>((rows, cur, i) => {
    if (i % size === 0) rows.push([cur]);
    else rows[rows.length - 1].push(cur);
    return rows;
  }, []);

const PlanCalendar: React.FC<Props> = ({ plan }) => {
  const enroll = toDateOnly(plan?.enrollDate);
  const start = toDateOnly(plan?.startDate);
  const end = toDateOnly(plan?.endDate);
  const today = new Date();

  const days = useMemo(() => {
    if (!enroll || !end) return [];
    const total = diffDays(end, enroll) + 1; // inclusive
    return Array.from({ length: Math.max(total, 1) }, (_, i) =>
      addDays(enroll, i)
    );
  }, [plan?.enrollDate, plan?.endDate]);

  const weeks = useMemo(() => chunk(days, 7), [days]);

  return (
    <div>
      <div className="sp-legend" style={{ marginBottom: 10 }}>
        <span className="sp-chip">
          <span className="sp-dot" style={{ background: "#2196f3" }} /> Enroll
        </span>
        <span className="sp-chip">
          <span className="sp-dot" style={{ background: "#4caf50" }} /> Start
        </span>
        <span className="sp-chip">
          <span className="sp-dot" style={{ background: "#f44336" }} /> End
        </span>
        <span className="sp-chip">
          <span className="sp-dot" style={{ background: "#ffeb3b" }} /> Today
        </span>
      </div>

      <div className="sp-cal">
        {weeks.flat().map((d, idx) => {
          const isEnroll = enroll && d.getTime() === enroll.getTime();
          const isStart = start && d.getTime() === start.getTime();
          const isEnd = end && d.getTime() === end.getTime();
          const isToday =
            d.toDateString() ===
            new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            ).toDateString();

          const cls = [
            "sp-cal-day",
            isEnroll ? "sp-cal-marker-enroll" : "",
            isStart ? "sp-cal-marker-start" : "",
            isEnd ? "sp-cal-marker-end" : "",
            isToday ? "sp-cal-marker-today" : "",
          ].join(" ");

          return (
            <div key={idx} className={cls}>
              <div>{fmt(d)}</div>
              <small>{["א", "ב", "ג", "ד", "ה", "ו", "ש"][d.getDay()]}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanCalendar;
