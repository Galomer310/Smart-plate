import React from "react";

type Props = {
  // percentages are fixed (carbs 50, protein 40, fat 10) but component is generic
  segments?: Array<{ label: string; percent: number; color: string }>;
};

const defaultSegments = [
  { label: "פחמימות 50%", percent: 50, color: "#CDE8FF" }, // blue-ish
  { label: "חלבון 40%", percent: 40, color: "#D9F6E5" }, // green-ish
  { label: "שומן 10%", percent: 10, color: "#FFE4DA" }, // orange-ish
];

const RoundPlate: React.FC<Props> = ({ segments = defaultSegments }) => {
  // build conic-gradient stops
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = acc;
      const end = acc + s.percent;
      acc = end;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `conic-gradient(${stops})`,
          border: "8px solid #fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      />
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {segments.map((s) => (
          <span
            key={s.label}
            className="sp-badge"
            style={{ background: s.color }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RoundPlate;
