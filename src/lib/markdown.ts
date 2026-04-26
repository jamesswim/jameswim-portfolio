/**
 * 把 Markdown 原始字串剝成純文字，給 blog 列表頁的摘要預覽用
 * 不依賴外部套件，輕量同步處理
 */
export function stripMarkdown(md: string): string {
  return md
    // 程式碼區塊（含內容整段拿掉）
    .replace(/```[\s\S]*?```/g, "")
    // 行內程式碼 `code` -> code
    .replace(/`([^`]+)`/g, "$1")
    // 圖片 ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // 連結 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // 標題符號 ## title -> title
    .replace(/^#{1,6}\s+/gm, "")
    // 粗體 **x** / __x__ -> x
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    // 斜體 *x* / _x_ -> x
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // 引言 > text -> text
    .replace(/^>\s+/gm, "")
    // 水平線
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // 無序列表項 - / * / + -> 空
    .replace(/^\s*[-*+]\s+/gm, "")
    // 有序列表項 1. -> 空
    .replace(/^\s*\d+\.\s+/gm, "")
    // HTML tag 整段拿掉
    .replace(/<[^>]+>/g, "")
    // 多重空白合併
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
