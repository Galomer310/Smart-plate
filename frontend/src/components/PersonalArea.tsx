// frontend/src/components/PersonalArea.tsx
import React, { useEffect, useState } from "react";
import api from "../api";
import PlanHeader from "./personal/PlanHeader";
import PlatePlanner from "./personal/PlatePlanner";
import ShoppingMenuCard from "./personal/ShoppingMenuCard";
import QuestionnaireForm from "./personal/QuestionnarireForm";
import type { PlanInfo } from "./personal/types";
import "./personal/personal.css";

type QuestionnaireGet = { exists: boolean };

const PersonalArea: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  // unread indicator for Messages button (text turns red when unread)
  const [hasUnread, setHasUnread] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1) Does questionnaire exist?
      const r = await api.get<QuestionnaireGet>("/api/user/questionnaire");
      const exists = r.data.exists === true;
      setNeedsQuestionnaire(!exists);

      // 2) If exists, load plan header info
      if (exists) {
        try {
          const planRes = await api.get<PlanInfo>("/api/user/plan");
          setPlan(planRes.data);
        } catch (e) {
          console.error("Failed to load plan:", e);
          setPlan(null);
        }
      } else {
        setPlan(null);
      }
    } catch (e: any) {
      setLoadError(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to check questionnaire status"
      );
    } finally {
      setLoading(false);
    }
  };

  // unread threads for the user (one thread with admin)
  const loadUnread = async () => {
    try {
      const r = await api.get<{ threads: Array<{ unread_count: number }> }>(
        "/api/messages/threads"
      );
      const unread = Number(r.data.threads?.[0]?.unread_count ?? 0);
      setHasUnread(unread > 0);
    } catch (e) {
      console.error("Failed to load unread state:", e);
    }
  };

  useEffect(() => {
    loadStatus();
    loadUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMessages = () => {
    // Optional: optimistic clear the red state when user opens the messages view
    setHasUnread(false);
    window.location.href = "/messages";
  };

  if (loading) return <div className="sp-personal">טוען...</div>;

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

  if (needsQuestionnaire) {
    return (
      <QuestionnaireForm
        onSubmitted={async () => {
          await loadStatus();
          await loadUnread();
        }}
      />
    );
  }

  // Questionnaire already submitted → show plan header + left/right area
  return (
    <div className="sp-personal">
      <PlanHeader
        plan={plan}
        onOpenMessages={openMessages}
        // Style the trigger (inside PlanHeader you likely render the button; if you pass style prop, use it there)
      />
      {/* If PlanHeader renders the Messages button internally, you can also place a separate visible button here: */}
      <div style={{ margin: "8px 0" }}>
        <button
          className="sp-badge"
          onClick={openMessages}
          style={hasUnread ? { color: "#b00020" } : undefined}
        >
          הודעות
        </button>
      </div>

      {/* Two-column area: left = PlatePlanner, right = Shopping/Menu card */}
      <div className="sp-main-grid">
        <PlatePlanner />
        <ShoppingMenuCard />
      </div>
    </div>
  );
};

export default PersonalArea;
