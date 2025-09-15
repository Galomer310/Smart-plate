import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";

type MealsByDate = Record<
  string,
  {
    breakfast?: {
      carbs: any;
      protein: string[];
      fat: string[];
      updatedAt: string;
    };
    lunch?: { carbs: any; protein: string[]; fat: string[]; updatedAt: string };
    dinner?: {
      carbs: any;
      protein: string[];
      fat: string[];
      updatedAt: string;
    };
  }
>;

const AdminUserMealsPage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [data, setData] = useState<MealsByDate>({});

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) navigate("/admin/login", { replace: true });
  }, [navigate]);

  const load = async () => {
    if (!userId) return;
    const r = await api.get<{ meals: MealsByDate }>(
      `/api/admin/users/${userId}/meals`,
      { params: { from, to } }
    );
    setData(r.data.meals || {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="sp-personal">
      <div
        className="sp-card"
        style={{ display: "flex", gap: 8, alignItems: "end" }}
      >
        <div>
          <label>From</label>
          <input
            className="sp-input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label>To</label>
          <input
            className="sp-input"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button className="sp-badge" onClick={load}>
          Load
        </button>
        <button
          className="sp-badge"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back
        </button>
      </div>

      <div className="sp-card">
        {Object.keys(data).length === 0 ? (
          <div style={{ opacity: 0.7 }}>No meals found for selected range.</div>
        ) : (
          Object.entries(data)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, obj]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <h3 style={{ margin: "8px 0" }}>{date}</h3>

                {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
                  const m = (obj as any)[meal];
                  return (
                    <div
                      key={meal}
                      className="sp-card"
                      style={{ marginBottom: 8 }}
                    >
                      <strong>
                        {meal === "breakfast"
                          ? "ארוחת בוקר"
                          : meal === "lunch"
                          ? "ארוחת צהריים"
                          : "ארוחת ערב"}
                      </strong>
                      {!m ? (
                        <div style={{ opacity: 0.6 }}>—</div>
                      ) : (
                        <div style={{ display: "grid", gap: 4 }}>
                          <div>
                            <b>פחמימות:</b> עלים ירוקים:{" "}
                            {(m.carbs?.greens || []).join(", ") || "—"}
                          </div>
                          <div>
                            <b></b> ירקות ירוקים:{" "}
                            {(m.carbs?.greenVeg || []).join(", ") || "—"}
                          </div>
                          <div>
                            <b></b> ירקות אדומים:{" "}
                            {(m.carbs?.redVeg || []).join(", ") || "—"}
                          </div>
                          <div>
                            <b></b> פירות + בונוס:{" "}
                            {(m.carbs?.fruitsBonus || []).join(", ") || "—"}
                          </div>
                          <div>
                            <b>חלבון:</b> {(m.protein || []).join(", ") || "—"}
                          </div>
                          <div>
                            <b>שומן:</b> {(m.fat || []).join(", ") || "—"}
                          </div>
                          <div style={{ opacity: 0.6 }}>
                            Updated: {new Date(m.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AdminUserMealsPage;
