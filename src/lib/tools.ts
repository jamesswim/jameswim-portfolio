// Catalog of small tools shown on /tools.
// This is intentionally hardcoded (not in DB) — tools are part of the codebase.

export type ToolStatus = "live" | "wip" | "planned";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  status: ToolStatus;
}

export const TOOLS: Tool[] = [
  {
    slug: "compiler",
    name: "Online Compiler",
    description:
      "在瀏覽器執行 C / C++ / Python 程式碼，沙箱化執行、即時看到輸出。",
    tags: ["C", "C++", "Python"],
    status: "wip",
  },
  // 未來擴充：regex tester, JSON formatter, base64 等
];
