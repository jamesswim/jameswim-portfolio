import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Jameswim 的部落格 — 技術筆記、學習心得、生活雜談",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}