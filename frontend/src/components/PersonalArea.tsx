// frontend/src/components/PersonalArea.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Local building blocks
import QuestionnaireForm from "./personal/QuestionnarireForm";
import PlanHeader from "./personal/PlanHeader";
import PlatePlanner, { type MealSelections } from "./personal/PlatePlanner";
import ShoppingMenuCard from "./personal/ShoppingMenuCard";

import "./personal/personal.css";

// ---- Server response shape (from /api/user/plan)
type ApiPlan = {
  startDate: string | null;
  endDate: string | null;
  dietDays: number;
  dayIndex: number; // server's "today day index"
  expired: boolean;
  tz?: string;
};

// ---- UI plan shape used by your personal components
type PlanInfo = {
  startDate: string | null;
  endDate: string | null;
  dietDays: number;
  todayDietDay: number; // renamed from server's dayIndex
  expired: boolean;
};

type MealName = "breakfast" | "lunch" | "dinner";
type MealRow = { selections: MealSelections; savedAt: string };
type MealsByName = Partial<Record<MealName, MealRow>>;

const todayISO = () => new Date().toISOString().slice(0, 10);

const PersonalArea: React.FC = () => {
  const navigate = useNavigate();

  // Questionnaire gate
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean>(true);

  // Plan (dates + counters)
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  // Meals for *today*
  const [meals, setMeals] = useState<MealsByName>({});

  // Editing state (when user taps "עריכה" on a saved meal)
  const [editing, setEditing] = useState<MealName | null>(null);

  // ---- Loaders ------------------------------------------------------------
  const loadQuestionnaireStatus = async () => {
    try {
      const r = await api.get<{ exists: boolean }>("/api/user/questionnaire");
      setHasQuestionnaire(!!r.data.exists);
    } catch {
      // If the route returns 404 for no questionnaire table, treat as not submitted
      setHasQuestionnaire(false);
    }
  };

  const loadPlan = async () => {
    try {
      const r = await api.get<ApiPlan>("/api/user/plan");
      const p = r.data;
      // Convert server shape -> UI shape
      const uiPlan: PlanInfo = {
        startDate: p.startDate,
        endDate: p.endDate,
        dietDays: p.dietDays ?? 0,
        todayDietDay: p.dayIndex ?? 0,
        expired: !!p.expired,
      };
      setPlan(uiPlan);
    } catch {
      // If a user has dates missing, keep plan null (UI stays minimal)
      setPlan(null);
    }
  };

  const loadMealsForToday = async () => {
    try {
      const r = await api.get<{ meals: MealsByName }>("/api/user/meals", {
        params: { date: todayISO() },
      });
      setMeals(r.data.meals || {});
    } catch {
      setMeals({});
    }
  };

  const loadAll = async () => {
    await loadQuestionnaireStatus();
    await loadPlan();
    await loadMealsForToday();
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Helpers ------------------------------------------------------------
  const nextEmptySlot = useMemo<MealName | null>(() => {
    if (!meals.breakfast) return "breakfast";
    if (!meals.lunch) return "lunch";
    if (!meals.dinner) return "dinner";
    return null;
  }, [meals]);

  const goToMessages = () => {
    navigate("/messages");
  };

  // ---- Save handlers ------------------------------------------------------
  const saveMeal = async (slot: MealName, s: MealSelections) => {
    await api.post(`/api/user/meals/${slot}`, s);
    await loadMealsForToday();
  };

  // Callback from PlatePlanner:
  // - In "create" mode it passes `mealName=null`, so we choose nextEmptySlot.
  // - In "edit" mode it passes the specific meal name that was edited.
  const handlePlateSaved = async (
    mealName: MealName | null,
    selections: MealSelections
  ) => {
    const target = mealName ?? nextEmptySlot;
    if (!target) {
      alert("כבר נשמרו שלוש ארוחות להיום");
      return;
    }
    await saveMeal(target, selections);
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  // When editing, provide the current selections to the planner
  const editingInitial: MealSelections | null = editing
    ? meals[editing]?.selections ?? null
    : null;

  // For the calendar: make PlanHeader render from plan.startDate
  // (it reads enrollDate for the calendar start; we add it without changing PlanInfo)
  const planForCalendar = plan ? { ...plan, enrollDate: plan.startDate } : null;

  // ---- Render gates -------------------------------------------------------
  if (!hasQuestionnaire) {
    return <QuestionnaireForm onSubmitted={loadAll} />;
  }

  return (
    <div className="sp-personal" style={{ direction: "rtl" }}>
      {/* Header with calendar & “messages” button */}
      <PlanHeader plan={planForCalendar as any} onOpenMessages={goToMessages} />

      {/* Two-column layout: left = plate planner, right = notes/saved meals */}
      <div
        className="sp-grid"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "start",
          marginTop: 16,
        }}
      >
        {/* Plate builder (create or edit) */}
        <PlatePlanner
          mode={editing ? "edit" : "create"}
          editingMeal={editing ?? undefined}
          initial={editingInitial}
          onCancelEdit={cancelEdit}
          onSaved={handlePlateSaved}
        />

        {/* Notes + the three saved meals (with “עריכה” buttons) */}
        <ShoppingMenuCard meals={meals} onEdit={(which) => setEditing(which)} />
      </div>
    </div>
  );
};

export default PersonalArea;
