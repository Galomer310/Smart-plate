import React, { useState } from "react";
import "./personal.css";

/**
 * A right-column card that toggles between:
 *  - Shopping List
 *  - Menu (Breakfast / Lunch / Dinner)
 *
 * Structure only (no real ingredients yet) so you can fill later.
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
        <div>
          {/* Placeholder list; add real items later */}
          <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.6 }}>
            <li style={{ opacity: 0.6 }}>
              <em>Item 1 (placeholder)</em>
            </li>
            <li style={{ opacity: 0.6 }}>
              <em>Item 2 (placeholder)</em>
            </li>
            <li style={{ opacity: 0.6 }}>
              <em>Item 3 (placeholder)</em>
            </li>
          </ul>
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
