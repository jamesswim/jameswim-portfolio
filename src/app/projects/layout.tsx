import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Jameswim 的工程作品集 — 嵌入式系統、UAV、Linux 韌體、BMC 相關專案案例。",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
