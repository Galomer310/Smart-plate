import React, { useState } from "react";
import "./personal.css";
import {
  CATEGORY_LABELS,
  SHOPPING_OPTIONS,
  type CategoryKey,
} from "./foodData";

/**
 * Toggle between Shopping List and Menu (Breakfast/Lunch/Dinner).
 * Shopping list shows the same categories used by the plate planner.
 */
const ShoppingMenuCard: React.FC = () => {
  const [view, setView] = useState<"list" | "menu">("list");
  const toggleView = () => setView((v) => (v === "list" ? "menu" : "list"));

  return (
    <div className="sp-card">
      <div className="sp-card-header">
        <h3 style={{ margin: 0 }}>
          {view === "list" ? "Shopping List" : "Menu"}
        </h3>
        <button className="sp-badge" onClick={toggleView}>
          {view === "list" ? "Show Menu" : "Show Shopping List"}
        </button>
      </div>

      {view === "list" ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {(Object.keys(SHOPPING_OPTIONS) as CategoryKey[]).map((cat) => (
            <section key={cat} className="sp-section">
              <h4 className="sp-section-title">{CATEGORY_LABELS[cat]}</h4>
              <ul className="sp-list">
                {SHOPPING_OPTIONS[cat].map((it) => (
                  <li key={it} style={{ opacity: 0.8 }}>
                    {it}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <section className="sp-section">
            <h4 className="sp-section-title">Breakfast</h4>
            <ul className="sp-list">
              <li style={{ opacity: 0.6 }}>
                <em>Add ingredients later</em>
              </li>
            </ul>
          </section>

          <section className="sp-section">
            <h4 className="sp-section-title">Lunch</h4>
            <ul className="sp-list">
              <li style={{ opacity: 0.6 }}>
                <em>Add ingredients later</em>
              </li>
            </ul>
          </section>

          <section className="sp-section">
            <h4 className="sp-section-title">Dinner</h4>
            <ul className="sp-list">
              <li style={{ opacity: 0.6 }}>
                <em>Add ingredients later</em>
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

export default ShoppingMenuCard;
