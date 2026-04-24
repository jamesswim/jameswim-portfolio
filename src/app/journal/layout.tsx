import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description: "工作日誌 — 任務管理、行程規劃與日常紀錄",
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}