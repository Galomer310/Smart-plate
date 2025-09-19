import React, { useMemo } from "react";
import type { PlanInfo } from "./types";
import "./personal.css";

type Props = { plan: PlanInfo | null };

/** Parse Date | ISO | DD/MM/YYYY to local date-only */
function parseDate(input?: any): Date | null {
  if (!input) return null;
  if (input instanceof Date && !Number.isNaN(input.getTime()))
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());

  if (typeof input === "string") {
    // Try ISO first
    const iso = new Date(input);
    if (!Number.isNaN(iso.getTime()))
      return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());

    // Try DD/MM/YYYY
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

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const PlanCalendar: React.FC<Props> = ({ plan }) => {
  const enroll = parseDate(plan?.enrollDate);
  const start = parseDate(plan?.startDate);
  const end = parseDate(plan?.endDate);
  const base = enroll || start; // ✅ fallback to start if enroll missing
  const today = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  const days = useMemo(() => {
    if (!base || !end) return [];
    const total = diffDays(end, base) + 1; // inclusive
    return Array.from({ length: Math.max(total, 0) }, (_, i) =>
      addDays(base, i)
    );
  }, [plan?.enrollDate, plan?.startDate, plan?.endDate]);

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
          const isEnroll = enroll && sameDate(d, enroll);
          const isStart = start && sameDate(d, start);
          const isEnd = end && sameDate(d, end);
          const isToday = sameDate(d, today);

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
