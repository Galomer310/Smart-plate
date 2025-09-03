import React from "react";

export type Filters = {
  name: string;
  age: string;
  plan: string;
  bmi: "" | "green" | "yellow" | "red";
};

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
};

const UserFilters: React.FC<Props> = ({ filters, onChange }) => {
  const update =
    (k: keyof Filters) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...filters, [k]: e.target.value });

  return (
    <div
      style={{
        marginBottom: "1rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <input
        name="name"
        placeholder="Filter by Name"
        value={filters.name}
        onChange={update("name")}
      />
      <input
        name="age"
        placeholder="Filter by Age"
        value={filters.age}
        onChange={update("age")}
      />
      <input
        name="plan"
        placeholder="Filter by Diet Time"
        value={filters.plan}
        onChange={update("plan")}
      />
      <select name="bmi" value={filters.bmi} onChange={update("bmi")}>
        <option value="">BMI: Any</option>
        <option value="green">BMI: Normal (Green)</option>
        <option value="yellow">BMI: Under (Yellow)</option>
        <option value="red">BMI: Above (Red)</option>
      </select>
    </div>
  );
};

export default UserFilters;
