import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import PlanHeader from "../personal/PlanHeader";
import PlatePlanner, { type MealSelections } from "../personal/PlatePlanner";
import ShoppingMenuCard from "../personal/ShoppingMenuCard";
import QuestionnaireForm from "../personal/QuestionnarireForm";
import type { PlanInfo } from "../personal/types";
import "../personal/personal.css";

type QuestionnaireGet = { exists: boolean };

type MealsState = {
  date: string; // YYYY-MM-DD (server TZ)
  breakfast?: { selections: MealSelections; savedAt: string };
  lunch?: { selections: MealSelections; savedAt: string };
  dinner?: { selections: MealSelections; savedAt: string };
};

const PersonalArea: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  const [meals, setMeals] = useState<MealsState | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const [editing, setEditing] = useState<
    null | "breakfast" | "lunch" | "dinner"
  >(null);
  const [editingInitial, setEditingInitial] = useState<MealSelections | null>(
    null
  );

  const loadMealsForToday = async () => {
    const todayRes = await api.get<any>("/api/user/meals");
    setMeals({
      date: todayRes.data.date,
      breakfast: todayRes.data.breakfast ?? undefined,
      lunch: todayRes.data.lunch ?? undefined,
      dinner: todayRes.data.dinner ?? undefined,
    });
  };

  const loadStatus = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1) Do we need to fill the questionnaire?
      const r = await api.get<QuestionnaireGet>("/api/user/questionnaire");
      const exists = r.data.exists === true;
      setNeedsQuestionnaire(!exists);

      // If questionnaire not done yet -> allow it first (as per your flow)
      if (!exists) {
        setPlan(null);
        setMeals(null);
        return;
      }

      // 2) Questionnaire exists: enforce password change BEFORE entering personal area
      const me = await api.get<{ mustChangePassword: boolean }>("/api/auth/me");
      if (me.data.mustChangePassword) {
        navigate("/force-password-change", { replace: true });
        return;
      }

      // 3) Load rest of the personal area
      try {
        const planRes = await api.get<PlanInfo>("/api/user/plan");
        setPlan(planRes.data);
      } catch {
        setPlan(null);
      }
      await loadMealsForToday();
    } catch (e: any) {
      setLoadError(e?.response?.data?.error || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const loadUnread = async () => {
    try {
      const r = await api.get<{ threads: Array<{ unread_count: number }> }>(
        "/api/messages/threads"
      );
      const unread = Number(r.data.threads?.[0]?.unread_count ?? 0) > 0;
      setHasUnread(unread);
    } catch {
      setHasUnread(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadStatus();
      await loadUnread();
    })();
  }, []);

  const openMessages = () => navigate("/messages");

  const handleSaved = (
    mealName: "breakfast" | "lunch" | "dinner" | null,
    sel: MealSelections
  ): void => {
    void (async () => {
      let target = mealName;
      if (!target) {
        target = !meals?.breakfast
          ? "breakfast"
          : !meals?.lunch
          ? "lunch"
          : !meals?.dinner
          ? "dinner"
          : null;
      }
      if (!target) {
        alert("כבר קיימות 3 ארוחות היום");
        return;
      }
      await api.post(`/api/user/meals/${target}`, sel);
      await loadMealsForToday();
    })();
  };

  const startEdit = (which: "breakfast" | "lunch" | "dinner") => {
    if (!meals) return;
    const m = meals[which];
    if (!m) return;
    setEditing(which);
    setEditingInitial(m.selections);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditingInitial(null);
  };

  if (loading) return <div className="sp-personal">טוען.</div>;
  if (loadError) {
    return (
      <div className="sp-personal">
        <div className="sp-card" style={{ color: "#b00020" }}>
          {loadError}
        </div>
        <button
          className="sp-badge"
          onClick={() => {
            loadStatus();
            loadUnread();
          }}
        >
          נסה שוב
        </button>
      </div>
    );
  }

  // Questionnaire first
  if (needsQuestionnaire) {
    return (
      <QuestionnaireForm
        onSubmitted={() => {
          // after questionnaire, go to forced password change
          navigate("/force-password-change", { replace: true });
        }}
      />
    );
  }

  // Normal personal area
  return (
    <div className="sp-personal">
      <PlanHeader plan={plan} onOpenMessages={openMessages} />
      <div style={{ margin: "8px 0" }}>
        <button
          className="sp-badge"
          onClick={openMessages}
          style={hasUnread ? { color: "#b00020" } : undefined}
        >
          הודעות
        </button>
      </div>

      <div className="sp-main-grid">
        <PlatePlanner
          mode={editing ? "edit" : "create"}
          editingMeal={editing ?? undefined}
          initial={editingInitial}
          onCancelEdit={cancelEdit}
          onSaved={handleSaved}
        />
        <ShoppingMenuCard
          meals={{
            breakfast: meals?.breakfast,
            lunch: meals?.lunch,
            dinner: meals?.dinner,
          }}
          onEdit={startEdit}
        />
      </div>
    </div>
  );
};

export default PersonalArea;
