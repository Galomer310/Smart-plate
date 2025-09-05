import React, { useState } from "react";
import "./personal.css";
import {
  CATEGORY_LABELS,
  SHOPPING_OPTIONS,
  type CategoryKey,
} from "./foodData";

/**
 * PlatePlanner
 * - Visual plate with conic segments (50/20/15/15)
 * - Each segment has an "Add" button → opens a dropdown with checkboxes
 * - Selected items are shown under the plate per category
 */
const PlatePlanner: React.FC = () => {
  const [openFor, setOpenFor] = useState<CategoryKey | null>(null);
  const [selected, setSelected] = useState<Record<CategoryKey, Set<string>>>({
    fiber: new Set(),
    protein: new Set(),
    fat: new Set(),
    carbs: new Set(),
  });

  const toggleOpen = (cat: CategoryKey) => {
    setOpenFor((curr) => (curr === cat ? null : cat));
  };

  const toggleItem = (cat: CategoryKey, item: string) => {
    setSelected((prev) => {
      const next = new Set(prev[cat]);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return { ...prev, [cat]: next };
    });
  };

  const closeAndSave = () => setOpenFor(null);

  return (
    <div className="sp-card">
      <h3 style={{ marginTop: 0 }}>Plate Planner</h3>

      {/* Plate visualization */}
      <div className="sp-plate-wrap">
        <div
          className="sp-plate"
          aria-label="Nutrition plate divided into 4 sections"
        />

        {/* Hotspots (positions are approximate for good UX) */}
        {/* Fiber (top half, 50%) */}
        <div className="sp-plate-hotspot sp-hot-fiber">
          <div className="sp-plate-title">Dietary Fiber (50%)</div>
          <button className="sp-badge" onClick={() => toggleOpen("fiber")}>
            Add
          </button>
        </div>

        {/* Protein (right-upper, 20%) */}
        <div className="sp-plate-hotspot sp-hot-protein">
          <div className="sp-plate-title">Protein (20%)</div>
          <button className="sp-badge" onClick={() => toggleOpen("protein")}>
            Add
          </button>
        </div>

        {/* Fat (right-lower, 15%) */}
        <div className="sp-plate-hotspot sp-hot-fat">
          <div className="sp-plate-title">Fat (15%)</div>
          <button className="sp-badge" onClick={() => toggleOpen("fat")}>
            Add
          </button>
        </div>

        {/* Carbs (left-lower, 15%) */}
        <div className="sp-plate-hotspot sp-hot-carbs">
          <div className="sp-plate-title">Complex Carbs (15%)</div>
          <button className="sp-badge" onClick={() => toggleOpen("carbs")}>
            Add
          </button>
        </div>

        {/* Dropdown popover */}
        {openFor && (
          <div className="sp-dropdown" role="dialog" aria-modal="true">
            <div className="sp-dropdown-header">
              <strong>{CATEGORY_LABELS[openFor]}</strong>
            </div>
            <div className="sp-dropdown-body">
              {SHOPPING_OPTIONS[openFor].map((item) => {
                const checked = selected[openFor].has(item);
                return (
                  <label key={item} className="sp-dropdown-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(openFor, item)}
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
            <div className="sp-dropdown-footer">
              <button className="sp-btn" onClick={closeAndSave}>
                Select
              </button>
              <button className="sp-btn" onClick={() => setOpenFor(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selections summary (under plate, mirrors categories) */}
      <div className="sp-plate-summary">
        {(["fiber", "protein", "fat", "carbs"] as CategoryKey[]).map((cat) => (
          <div key={cat} className="sp-plate-summary-col">
            <div className="sp-plate-summary-title">{CATEGORY_LABELS[cat]}</div>
            {selected[cat].size === 0 ? (
              <div className="sp-plate-summary-empty">
                — No items selected —
              </div>
            ) : (
              <ul className="sp-plate-summary-list">
                {Array.from(selected[cat]).map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatePlanner;
