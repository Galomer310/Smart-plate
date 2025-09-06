import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import "../../components/personal/personal.css";
import { IoIosArrowBack } from "react-icons/io";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

const PAGE_SIZE = 50;

function byCreatedAtAsc(a: Message, b: Message) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}
function mergeByIdAsc(existing: Message[], incoming: Message[]) {
  const map = new Map<string, Message>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(byCreatedAtAsc);
}

/**
 * User-only messages page.
 * - Back arrow → /personal
 * - Fixed title (Hebrew)
 * - Auto-connect to Admin
 */
const UserMessagesPage: React.FC = () => {
  const { otherId: routeOther } = useParams();
  const navigate = useNavigate();

  // Auth: must have user access token
  const accessToken = localStorage.getItem("accessToken");
  useEffect(() => {
    if (!accessToken) navigate("/login", { replace: true });
  }, [accessToken, navigate]);

  const [otherId, setOtherId] = useState<string | null>(routeOther ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const title = "כתבי לי ואשוב אליך בהקדם";

  const resolveAdminForUser = async () => {
    try {
      const r = await api.get<{ adminId: string }>("/api/messages/my-admin");
      setOtherId(r.data.adminId);
      navigate(`/messages/conversation/${r.data.adminId}`, { replace: true });
    } catch (e) {
      console.error("Failed to resolve admin id:", e);
    }
  };

  async function fetchChunk(
    id: string,
    opts?: { before?: string | null; silent?: boolean }
  ) {
    const params = new URLSearchParams();
    if (opts?.before) params.set("before", opts.before);
    params.set("limit", String(PAGE_SIZE));
    if (!opts?.silent) setInitialLoading(true);
    const r = await api.get<{ messages: Message[] }>(
      `/api/messages/conversation/${id}?${params.toString()}`
    );
    if (!opts?.silent) setInitialLoading(false);
    return r.data.messages;
  }

  async function loadInitial(id: string) {
    setMessages([]);
    setHasMore(true);
    const chunk = await fetchChunk(id, { before: null, silent: false });
    setMessages(chunk);
    setHasMore(chunk.length === PAGE_SIZE);
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function loadOlder() {
    if (!otherId || loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;

    const oldest = messages[0];
    const older = await fetchChunk(otherId, {
      before: oldest.created_at,
      silent: true,
    });

    setMessages((prev) => mergeByIdAsc([...older, ...prev], []));
    setHasMore(older.length === PAGE_SIZE);

    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });

    setLoadingOlder(false);
  }

  useEffect(() => {
    if (!routeOther) resolveAdminForUser();
    else {
      setOtherId(routeOther);
      loadInitial(routeOther);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeOther]);

  useEffect(() => {
    if (!otherId) return;
    let timer: number | undefined;
    const tick = async () => {
      try {
        const latest = await fetchChunk(otherId, { silent: true });
        setMessages((prev) => mergeByIdAsc(prev, latest));
      } catch (e) {
        console.error("poll error:", e);
      }
      timer = window.setTimeout(tick, 5000);
    };
    tick();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherId || !body.trim()) return;
    const text = body.trim();
    setBody("");
    try {
      const r = await api.post<{ message: Message }>(
        `/api/messages/${otherId}`,
        { body: text }
      );
      setMessages((prev) => mergeByIdAsc(prev, [r.data.message]));
      setTimeout(
        () =>
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          }),
        0
      );
    } catch (e: any) {
      console.error("User send failed:", e?.response?.data || e);
      alert(e?.response?.data?.error || "Failed to send");
    }
  };

  const handleBack = () => navigate("/personal");

  return (
    <div className="sp-personal">
      {/* Back bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 0 12px 0",
        }}
      >
        <button
          onClick={handleBack}
          aria-label="Back"
          title="Back"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "1px solid #e5e5e5",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <IoIosArrowBack size={20} />
        </button>
        <div style={{ marginLeft: 8, fontWeight: 700 }}>{title}</div>
      </div>

      {/* Conversation only */}
      <div
        className="sp-card"
        style={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}
      >
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
          <strong>{title}</strong>
        </div>

        <div
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop < 60) loadOlder();
          }}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "10px 12px",
            display: "grid",
            gap: "6px",
            background: loadingOlder
              ? "linear-gradient(#fff, #fff) padding-box, repeating-linear-gradient(90deg,#f5f5f5 0,#f5f5f5 2px,#fff 2px,#fff 6px) border-box"
              : "#fff",
            borderRadius: 10,
          }}
        >
          {initialLoading ? (
            <div>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No messages yet. Say hi 👋</div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id !== (otherId ?? "");
              return (
                <div
                  key={m.id}
                  style={{
                    justifySelf: mine ? "end" : "start",
                    background: mine ? "#E6F3FF" : "#EAFBE7",
                    border: "1px solid #e0e0e0",
                    borderRadius: 10,
                    padding: "6px 10px",
                    maxWidth: "80%",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {otherId && (
          <form
            onSubmit={send}
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid #eee",
              position: "sticky",
              bottom: 0,
              background: "#fff",
            }}
          >
            <input
              className="sp-input"
              placeholder="Type a message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="sp-badge" type="submit" disabled={!body.trim()}>
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserMessagesPage;
