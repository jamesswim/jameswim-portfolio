"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_CATEGORIES = ["學習", "求職", "專案", "其他"];
const PRIORITIES = ["high", "medium", "low"];
const STATUSES = ["todo", "doing", "done"];

const PRIORITY_STYLES: Record<string, { bg: string; label: string }> = {
  high: { bg: "#dc2626", label: "High" },
  medium: { bg: "#ca8a04", label: "Medium" },
  low: { bg: "#16a34a", label: "Low" },
};

const STATUS_INFO: Record<string, { label: string; icon: string }> = {
  todo: { label: "待完成", icon: "□" },
  doing: { label: "進行中", icon: "◐" },
  done: { label: "已完成", icon: "☑" },
};

interface Entry {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  status: string;
  date: string;
  time: string | null;
  created_at: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function JournalPage() {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("學習");
  const [customCategory, setCustomCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [entryTime, setEntryTime] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("全部");
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("journal")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEntries(data || []);
  };

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("學習");
    setCustomCategory("");
    setPriority("medium");
    setStatus("todo");
    setEntryDate(selectedDateStr);
    setEntryTime("");
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const finalCategory =
      category === "__custom__" ? customCategory : category;
    if (!finalCategory.trim()) return;

    if (editing) {
      await supabase
        .from("journal")
        .update({
          title,
          content,
          category: finalCategory,
          priority,
          status,
          date: entryDate,
          time: entryTime || null,
        })
        .eq("id", editing);
    } else {
      await supabase.from("journal").insert({
        title,
        content,
        category: finalCategory,
        priority,
        status,
        date: entryDate,
        time: entryTime || null,
        user_id: user.id,
      });
    }
    resetForm();
    fetchEntries();
  };

  const handleEdit = (entry: Entry) => {
    setTitle(entry.title);
    setContent(entry.content);
    if (DEFAULT_CATEGORIES.includes(entry.category)) {
      setCategory(entry.category);
      setCustomCategory("");
    } else {
      setCategory("__custom__");
      setCustomCategory(entry.category);
    }
    setPriority(entry.priority);
    setStatus(entry.status);
    setEntryDate(entry.date);
    setEntryTime(entry.time || "");
    setEditing(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這筆日誌嗎？")) return;
    await supabase.from("journal").delete().eq("id", id);
    fetchEntries();
  };

  const cycleStatus = async (entry: Entry) => {
    const order = ["todo", "doing", "done"];
    const next = order[(order.indexOf(entry.status) + 1) % 3];
    await supabase.from("journal").update({ status: next }).eq("id", entry.id);
    fetchEntries();
  };

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  const datesWithEntries = new Set(
    entries.filter((e) => !e.time).map((e) => e.date)
  );
  const datesWithSchedule = new Set(
    entries.filter((e) => e.time).map((e) => e.date)
  );

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...entries.map((e) => e.category)])
  );

  const categoryCounts: Record<string, number> = {};
  entries.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  const globalSearchResults =
    search || dateFrom || dateTo
      ? entries
          .filter(
            (e) =>
              search === "" ||
              e.title.toLowerCase().includes(search.toLowerCase()) ||
              e.content.toLowerCase().includes(search.toLowerCase())
          )
          .filter((e) => (dateFrom ? e.date >= dateFrom : true))
          .filter((e) => (dateTo ? e.date <= dateTo : true))
          .filter(
            (e) =>
              filterCategory === "全部" || e.category === filterCategory
          )
      : [];

  const dayEntries = entries
    .filter((e) => e.date === selectedDateStr)
    .filter(
      (e) => filterCategory === "全部" || e.category === filterCategory
    );

  const scheduledEntries = dayEntries
    .filter((e) => e.time)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const todoEntries = dayEntries
    .filter((e) => !e.time && e.status === "todo")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (
        (order[a.priority as keyof typeof order] ?? 1) -
        (order[b.priority as keyof typeof order] ?? 1)
      );
    });

  const doingEntries = dayEntries
    .filter((e) => !e.time && e.status === "doing")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (
        (order[a.priority as keyof typeof order] ?? 1) -
        (order[b.priority as keyof typeof order] ?? 1)
      );
    });

  const doneEntries = dayEntries
    .filter((e) => !e.time && e.status === "done")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (
        (order[a.priority as keyof typeof order] ?? 1) -
        (order[b.priority as keyof typeof order] ?? 1)
      );
    });

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月",
  ];

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const prevYear = () => setCalendarDate(new Date(year - 1, month, 1));
  const nextYear = () => setCalendarDate(new Date(year + 1, month, 1));

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Journal</h1>
          <button
            onClick={signIn}
            className="px-6 py-3 bg-neutral-100 text-neutral-950 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  const renderEntry = (entry: Entry, showDate?: boolean) => (
    <div
      key={entry.id}
      className={`border border-neutral-800 rounded-lg p-3 transition-opacity ${
        entry.status === "done" ? "opacity-50" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2 flex-1">
          {!entry.time && (
            <button
              onClick={() => cycleStatus(entry)}
              className="mt-0.5 hover:opacity-70 transition-opacity"
              title="點擊切換狀態"
            >
              {STATUS_INFO[entry.status].icon}
            </button>
          )}
          {entry.time && (
            <span className="text-xs mt-1" style={{ color: "#facc15" }}>
              🕐 {entry.time}
            </span>
          )}
          <div className="flex-1">
            <button
              onClick={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              className="text-left w-full"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-medium text-sm ${
                    entry.status === "done"
                      ? "line-through text-neutral-600"
                      : ""
                  }`}
                >
                  {entry.title}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{
                    backgroundColor:
                      PRIORITY_STYLES[entry.priority]?.bg || "#6b7280",
                  }}
                >
                  {PRIORITY_STYLES[entry.priority]?.label || entry.priority}
                </span>
              </div>
            </button>
            <div className="flex items-center gap-2 mt-1">
              {showDate && (
                <span className="text-xs text-neutral-500">{entry.date}</span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                {entry.category}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => handleEdit(entry)}
            className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(entry.id)}
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: "#dc2626" }}
          >
            Del
          </button>
        </div>
      </div>
      {expandedId === entry.id && entry.content && (
        <div className="mt-2 ml-6 text-xs text-neutral-400 whitespace-pre-wrap border-t border-neutral-800 pt-2">
          {entry.content}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-24">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Journal</h1>
          <a
            href="/"
            style={{ color: "#3b82f6" }}
            className="text-sm font-medium hover:opacity-80 transition-opacity"
          >
            ← Home
          </a>
        </div>

        {/* Three Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 200px", gap: "24px" }}>

          {/* Left Sidebar - Search */}
          <div>
            <div
              className="border border-neutral-800 rounded-lg"
              style={{ backgroundColor: "#0f0f0f", padding: "16px" }}
            >
              <p className="text-xs text-neutral-500 mb-3 font-medium">🔍 全域搜尋</p>
              <input
                type="text"
                placeholder="搜尋所有日誌..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSearchResults(true);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 mb-3"
              />

              <p className="text-xs text-neutral-500 mb-2 font-medium">📅 日期範圍</p>
              <div className="mb-2">
                <label className="text-xs text-neutral-600 block mb-1">從</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div className="mb-3">
                <label className="text-xs text-neutral-600 block mb-1">到</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>

              {(search || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setDateFrom("");
                    setDateTo("");
                    setShowSearchResults(false);
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors mb-3"
                >
                  ✕ 清除搜尋
                </button>
              )}

              {showSearchResults && globalSearchResults.length > 0 && (
                <div className="border-t border-neutral-800 pt-3">
                  <p className="text-xs text-neutral-500 mb-2">
                    找到 {globalSearchResults.length} 筆
                  </p>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }} className="space-y-2">
                    {globalSearchResults.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => {
                          const d = new Date(entry.date + "T12:00:00");
                          setSelectedDate(d);
                          setCalendarDate(d);
                          setShowSearchResults(false);
                        }}
                        className="w-full text-left p-2 rounded bg-neutral-900 hover:bg-neutral-800 transition-colors"
                      >
                        <p className="text-xs font-medium truncate">
                          {entry.title}
                        </p>
                        <p className="text-xs text-neutral-500">{entry.date}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showSearchResults &&
                (search || dateFrom || dateTo) &&
                globalSearchResults.length === 0 && (
                  <p className="text-xs text-neutral-500 border-t border-neutral-800 pt-3">
                    沒有找到符合的日誌。
                  </p>
                )}
            </div>
          </div>

          {/* Center - Calendar + Day Content */}
          <div>
            {/* Calendar */}
            <div
              className="border border-neutral-700 rounded-lg mb-8"
              style={{ backgroundColor: "#171717", padding: "24px 32px 32px 32px" }}
            >
              <div className="flex justify-between items-center mb-4" style={{ padding: "0 8px" }}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={viewMode === "month" ? prevMonth : prevYear}
                    className="text-neutral-400 hover:text-neutral-100 transition-colors"
                  >
                    ◀
                  </button>
                  <span className="font-medium">
                    {viewMode === "month"
                      ? `${year}年 ${monthNames[month]}`
                      : `${year}年`}
                  </span>
                  <button
                    onClick={viewMode === "month" ? nextMonth : nextYear}
                    className="text-neutral-400 hover:text-neutral-100 transition-colors"
                  >
                    ▶
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 rounded text-xs ${
                      viewMode === "month"
                        ? "bg-neutral-100 text-neutral-950"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    月曆
                  </button>
                  <button
                    onClick={() => setViewMode("year")}
                    className={`px-3 py-1 rounded text-xs ${
                      viewMode === "year"
                        ? "bg-neutral-100 text-neutral-950"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    年曆
                  </button>
                </div>
              </div>

              {viewMode === "month" ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "4px",
                      textAlign: "center",
                    }}
                    className="text-xs text-neutral-500 mb-2"
                  >
                    {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "4px",
                      textAlign: "center",
                    }}
                    className="text-sm"
                  >
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isSelected = dateStr === selectedDateStr;
                      const hasEntries = datesWithEntries.has(dateStr);
                      const hasSchedule = datesWithSchedule.has(dateStr);
                      const isToday =
                        dateStr ===
                        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

                      return (
                        <button
                          key={day}
                          onClick={() => {
                            const d = new Date(year, month, day, 12);
                            setSelectedDate(d);
                          }}
                          className={`relative py-2 rounded transition-colors ${
                            isSelected
                              ? "bg-neutral-100 text-neutral-950 font-bold"
                              : isToday
                              ? "bg-neutral-800 text-neutral-100"
                              : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                          style={
                            hasSchedule && !isSelected
                              ? {
                                  outline: "2px solid #facc15",
                                  outlineOffset: "-2px",
                                  borderRadius: "6px",
                                }
                              : undefined
                          }
                        >
                          {day}
                          {hasEntries && !isSelected && (
                            <span
                              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{ backgroundColor: "#3b82f6" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                  }}
                >
                  {monthNames.map((mName, mIndex) => {
                    const hasAny = entries.some((e) => {
                      const d = new Date(e.date + "T12:00:00");
                      return (
                        d.getFullYear() === year && d.getMonth() === mIndex
                      );
                    });
                    return (
                      <button
                        key={mName}
                        onClick={() => {
                          setCalendarDate(new Date(year, mIndex, 1));
                          setViewMode("month");
                        }}
                        className={`py-3 rounded text-sm transition-colors ${
                          mIndex === month &&
                          year === calendarDate.getFullYear()
                            ? "bg-neutral-100 text-neutral-950 font-bold"
                            : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                        }`}
                      >
                        {mName}
                        {hasAny && (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full ml-1"
                            style={{ backgroundColor: "#3b82f6" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Day Content */}
            <div
              className="border border-neutral-800 rounded-lg"
              style={{ backgroundColor: "#0f0f0f", padding: "24px" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  📅{" "}
                  {selectedDate.toLocaleDateString("zh-TW", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </h2>
                {!showForm && (
                  <button
                    onClick={() => {
                      setEntryDate(selectedDateStr);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  >
                    + New Entry
                  </button>
                )}
              </div>

              {/* New/Edit Form */}
              {showForm && (
                <div className="border border-neutral-700 rounded-lg p-4 mb-6" style={{ backgroundColor: "#171717" }}>
                  <h3 className="text-sm font-semibold mb-3">
                    {editing ? "編輯日誌" : "新增日誌"}
                  </h3>

                  <input
                    type="text"
                    placeholder="標題"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 mb-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                  />

                  <textarea
                    placeholder="詳細內容..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 mb-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }} className="mb-3">
                    <div>
                      <label className="text-xs text-neutral-500 mb-1 block">日期</label>
                      <input
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 mb-1 block">時間（選填）</label>
                      <select
                        value={entryTime}
                        onChange={(e) => setEntryTime(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                      >
                        <option value="">不設定</option>
                        {Array.from({ length: 48 }).map((_, i) => {
                          const hour = String(Math.floor(i / 2)).padStart(2, "0");
                          const minute = i % 2 === 0 ? "00" : "30";
                          const timeStr = `${hour}:${minute}`;
                          return (
                            <option key={timeStr} value={timeStr}>
                              {timeStr}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 mb-1 block">分類</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                      >
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">自訂...</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 mb-1 block">優先</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>{PRIORITY_STYLES[p].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 mb-1 block">狀態</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_INFO[s].icon} {STATUS_INFO[s].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {category === "__custom__" && (
                    <input
                      type="text"
                      placeholder="輸入自訂分類名稱"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 mb-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                    />
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={resetForm}
                      className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-3 py-1.5 bg-neutral-100 text-neutral-950 rounded text-xs font-medium hover:bg-white transition-colors"
                    >
                      {editing ? "更新" : "儲存"}
                    </button>
                  </div>
                </div>
              )}

              {/* Scheduled Entries */}
              {scheduledEntries.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                    <span>📌</span>
                    <span>預定行程</span>
                    <span className="text-neutral-600">({scheduledEntries.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {scheduledEntries.map((entry) => renderEntry(entry))}
                  </div>
                </div>
              )}

              {/* Todo Entries */}
              {todoEntries.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                    <span>□</span>
                    <span>待完成</span>
                    <span className="text-neutral-600">({todoEntries.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {todoEntries.map((entry) => renderEntry(entry))}
                  </div>
                </div>
              )}

              {/* Doing Entries */}
              {doingEntries.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                    <span>◐</span>
                    <span>進行中</span>
                    <span className="text-neutral-600">({doingEntries.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {doingEntries.map((entry) => renderEntry(entry))}
                  </div>
                </div>
              )}

              {/* Done Entries */}
              {doneEntries.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                    <span>☑</span>
                    <span>已完成</span>
                    <span className="text-neutral-600">({doneEntries.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {doneEntries.map((entry) => renderEntry(entry))}
                  </div>
                </div>
              )}

              {dayEntries.length === 0 && !showForm && (
                <p className="text-neutral-500 text-sm">這天還沒有日誌。</p>
              )}
            </div>
          </div>

          {/* Right Sidebar - Categories */}
          <div>
            <div
              className="border border-neutral-800 rounded-lg"
              style={{ backgroundColor: "#0f0f0f", padding: "16px" }}
            >
              <p className="text-xs text-neutral-500 mb-3 font-medium">📂 分類標籤</p>
              <div className="space-y-1">
                <button
                  onClick={() => setFilterCategory("全部")}
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                    filterCategory === "全部"
                      ? "bg-neutral-100 text-neutral-950 font-medium"
                      : "text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  全部 ({entries.length})
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                      filterCategory === cat
                        ? "bg-neutral-100 text-neutral-950 font-medium"
                        : "text-neutral-400 hover:bg-neutral-800"
                    }`}
                  >
                    {cat} ({categoryCounts[cat] || 0})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}