import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Jameswim 的工程師工具箱 — 線上編譯器與其他便利小工具。",
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
