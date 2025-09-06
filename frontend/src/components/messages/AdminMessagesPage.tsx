import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import "../../components/personal/personal.css";
import { IoIosArrowBack } from "react-icons/io";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string; // ISO
  read_at: string | null;
};

type Thread = {
  other_id: string;
  name: string | null;
  email: string | null;
  last_body: string | null;
  last_created_at: string | null;
  unread_count: number;
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
 * Admin-only messages page.
 * - Back arrow → /admin/dashboard
 * - Header shows user's name (from navigate state or threads fallback)
 * - Uses adminToken explicitly for API calls so role is never confused
 */
const AdminMessagesPage: React.FC = () => {
  const { otherId: routeOther } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;

  // --- Auth guard: must have adminToken
  const adminToken = localStorage.getItem("adminToken");
  useEffect(() => {
    if (!adminToken) navigate("/admin/login", { replace: true });
  }, [adminToken, navigate]);

  const [otherId, setOtherId] = useState<string | null>(routeOther ?? null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const userNameFromNav: string | undefined = location?.state?.name;
  const userEmailFromNav: string | undefined = location?.state?.email;

  // Helper to call API as admin explicitly
  const aget = <T,>(url: string, params?: any) =>
    api.get<T>(url, {
      params,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  const apost = <T,>(url: string, data?: any) =>
    api.post<T>(url, data, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

  const loadThreads = async () => {
    try {
      const r = await aget<{ threads: Thread[] }>("/api/messages/threads");
      const list = r.data.threads.map((t: any) => ({
        other_id: t.other_id ?? t.otherid ?? t.otherId,
        name: t.name ?? null,
        email: t.email ?? null,
        last_body: t.last_body ?? null,
        last_created_at: t.last_created_at ?? null,
        unread_count: Number(t.unread_count ?? 0),
      }));
      setThreads(list);
    } catch (e) {
      console.error("Admin: failed to load threads:", e);
      setThreads([]);
    }
  };

  async function fetchChunk(
    id: string,
    opts?: { before?: string | null; silent?: boolean }
  ) {
    const params: any = { limit: PAGE_SIZE };
    if (opts?.before) params.before = opts.before;
    if (!opts?.silent) setInitialLoading(true);
    const r = await aget<{ messages: Message[] }>(
      `/api/messages/conversation/${id}`,
      params
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
    loadThreads();
    if (routeOther) {
      setOtherId(routeOther);
      loadInitial(routeOther);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeOther]);

  // Poll for newer without flicker
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

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 60) loadOlder();
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherId || !body.trim()) return;
    const text = body.trim();
    setBody("");

    try {
      const r = await apost<{ message: Message }>(`/api/messages/${otherId}`, {
        body: text,
      });
      setMessages((prev) => mergeByIdAsc(prev, [r.data.message]));
      setTimeout(
        () =>
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          }),
        0
      );
      loadThreads(); // refresh counters
    } catch (e: any) {
      console.error("Admin send failed:", e?.response?.data || e);
      alert(e?.response?.data?.error || "Failed to send");
    }
  };

  const headerTitle = useMemo(() => {
    // Prefer name from navigation state, else find in threads, else email, else id
    const t = threads.find((x) => x.other_id === otherId);
    return (
      userNameFromNav ||
      t?.name ||
      userEmailFromNav ||
      t?.email ||
      otherId ||
      "Conversation"
    );
  }, [threads, otherId, userNameFromNav, userEmailFromNav]);

  const handleBack = () => navigate("/admin/dashboard");

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
        <div style={{ marginLeft: 8, fontWeight: 700 }}>{headerTitle}</div>
      </div>

      <div
        className="sp-main-grid"
        style={{ gridTemplateColumns: "300px 1fr" }}
      >
        {/* Left: threads */}
        <div
          className="sp-card"
          style={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            maxHeight: "80vh",
          }}
        >
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
            <strong>Conversations</strong>
          </div>
          <div style={{ overflow: "auto", padding: "8px" }}>
            {threads.length === 0 ? (
              <div style={{ opacity: 0.7, padding: 8 }}>
                No conversations yet.
              </div>
            ) : (
              threads.map((t) => (
                <Link
                  key={t.other_id}
                  to={`/admin/messages/${t.other_id}`}
                  className="sp-list-item"
                  style={{
                    display: "block",
                    padding: "8px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "inherit",
                    background:
                      t.other_id === otherId ? "#f2f7ff" : "transparent",
                    border: "1px solid #eee",
                    marginBottom: 6,
                  }}
                  state={{ name: t.name, email: t.email }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {t.name || t.email || t.other_id}
                  </div>
                  {t.last_body && (
                    <div style={{ opacity: 0.8, fontSize: 12, marginTop: 2 }}>
                      {t.last_body.length > 60
                        ? t.last_body.slice(0, 60) + "…"
                        : t.last_body}
                    </div>
                  )}
                  {t.unread_count > 0 && (
                    <div
                      className="sp-badge"
                      style={{ marginTop: 6, display: "inline-block" }}
                    >
                      {t.unread_count} unread
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: conversation */}
        <div
          className="sp-card"
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "80vh",
          }}
        >
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
            <strong>{headerTitle}</strong>
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
              <button
                className="sp-badge"
                type="submit"
                disabled={!body.trim()}
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
