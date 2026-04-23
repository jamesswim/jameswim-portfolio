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
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    setEntryDate(new Date().toISOString().split("T")[0]);
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

  const datesWithEntries = new Set(entries.map((e) => e.date));

  const dayEntries = entries
    .filter((e) => e.date === selectedDateStr)
    .filter(
      (e) =>
        search === "" ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.content.toLowerCase().includes(search.toLowerCase())
    );

  const todoEntries = dayEntries.filter((e) => e.status === "todo");
  const doingEntries = dayEntries.filter((e) => e.status === "doing");
  const doneEntries = dayEntries.filter((e) => e.status === "done");

  const sortByPriority = (a: Entry, b: Entry) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (
      (order[a.priority as keyof typeof order] ?? 1) -
      (order[b.priority as keyof typeof order] ?? 1)
    );
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月",
  ];

  const prevMonth = () =>
    setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCalendarDate(new Date(year, month + 1, 1));
  const prevYear = () =>
    setCalendarDate(new Date(year - 1, month, 1));
  const nextYear = () =>
    setCalendarDate(new Date(year + 1, month, 1));

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

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Journal</h1> 
          <a
            href="/"
            style={{ color: "#3b82f6" }}
            className="text-sm font-medium hover:opacity-80 transition-opacity"
          >
            ← Home
          </a>
        </div>

        {/* Calendar Section */}
        <div className="border border-neutral-700 rounded-lg mb-12" style={{ backgroundColor: "#171717", padding: "8px 32px 32px 32px" }}>
        <div className="flex justify-between items-center mb-4 px-4 pt-4 pb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={viewMode === "month" ? prevMonth : prevYear}
                className="text-neutral-400 hover:text-neutral-100 transition-colors px-2"
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
                className="text-neutral-400 hover:text-neutral-100 transition-colors px-2"
              >
                ▶
              </button>
            </div>
            <div className="flex gap-4">
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
               <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }} className="text-xs text-neutral-500 mb-2">
                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }} className="text-sm">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelected = dateStr === selectedDateStr;
                  const hasEntries = datesWithEntries.has(dateStr);
                  const isToday = dateStr === new Date().toISOString().split("T")[0];

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {monthNames.map((mName, mIndex) => {
                const hasAny = entries.some((e) => {
                  const d = new Date(e.date);
                  return d.getFullYear() === year && d.getMonth() === mIndex;
                });
                return (
                  <button
                    key={mName}
                    onClick={() => {
                      setCalendarDate(new Date(year, mIndex, 1));
                      setViewMode("month");
                    }}
                    className={`py-3 rounded text-sm transition-colors ${
                      mIndex === month && year === calendarDate.getFullYear()
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
        <div className="border border-neutral-800 rounded-lg p-6" style={{ backgroundColor: "#0f0f0f" }}>
        {/* Day Header + Actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            📅 {selectedDate.toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </h2>
          <div className="flex gap-3">
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
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="搜尋日誌..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 mb-6"
        />

        {/* New/Edit Form */}
        {showForm && (
          <div className="border border-neutral-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "編輯日誌" : "新增日誌"}
            </h2>

            <input
              type="text"
              placeholder="標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 mb-4 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />

            <textarea
              placeholder="詳細內容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 mb-4 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
            />

            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">
                  日期
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 mb-1 block">
                  分類
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">自訂...</option>
                </select>
              </div>

              {category === "__custom__" && (
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    自訂分類
                  </label>
                  <input
                    type="text"
                    placeholder="輸入新分類"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-500 mb-1 block">
                  優先等級
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_STYLES[p].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-500 mb-1 block">
                  狀態
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_INFO[s].icon} {STATUS_INFO[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg text-sm font-medium hover:bg-white transition-colors"
              >
                {editing ? "更新" : "儲存"}
              </button>
            </div>
          </div>
        )}

        {/* Entries by Status */}
        {dayEntries.length === 0 ? (
          <p className="text-neutral-500 text-sm">這天還沒有日誌。</p>
        ) : (
          <>
            {[
              { key: "todo", entries: todoEntries.sort(sortByPriority) },
              { key: "doing", entries: doingEntries.sort(sortByPriority) },
              { key: "done", entries: doneEntries.sort(sortByPriority) },
            ]
              .filter((group) => group.entries.length > 0)
              .map((group) => (
                <div key={group.key} className="mb-6">
                  <h3 className="text-sm text-neutral-500 mb-3 flex items-center gap-2">
                    <span>{STATUS_INFO[group.key].icon}</span>
                    <span>{STATUS_INFO[group.key].label}</span>
                    <span className="text-neutral-600">
                      ({group.entries.length})
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`border border-neutral-800 rounded-lg p-4 transition-opacity ${
                          entry.status === "done" ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              onClick={() => cycleStatus(entry)}
                              className="mt-0.5 text-lg hover:opacity-70 transition-opacity"
                              title="點擊切換狀態"
                            >
                              {STATUS_INFO[entry.status].icon}
                            </button>
                            <div className="flex-1">
                            <button
                                onClick={() =>
                                  setExpandedId(
                                    expandedId === entry.id
                                      ? null
                                      : entry.id
                                  )
                                }
                                className="text-left w-full"
                              >
                                <div className="flex items-center gap-4">
                                  <h4
                                    className={`font-medium ${
                                      entry.status === "done"
                                        ? "line-through text-neutral-600"
                                        : ""
                                    }`}
                                  >
                                    {entry.title}
                                  </h4>
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                    style={{
                                      backgroundColor:
                                        PRIORITY_STYLES[entry.priority]?.bg ||
                                        "#6b7280",
                                    }}
                                  >
                                    {PRIORITY_STYLES[entry.priority]?.label ||
                                      entry.priority}
                                  </span>
                                </div>
                              </button>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                                  {entry.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 ml-4">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-sm hover:opacity-80 transition-opacity"
                              style={{ color: "#dc2626" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {expandedId === entry.id && entry.content && (
                          <div className="mt-3 ml-8 text-sm text-neutral-400 whitespace-pre-wrap border-t border-neutral-800 pt-3">
                            {entry.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </>
        )}
        </div>
      </div>
    </main>
  );
}