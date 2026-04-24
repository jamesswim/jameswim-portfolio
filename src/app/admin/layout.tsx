import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Jameswim 管理後台",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}