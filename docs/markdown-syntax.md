# Markdown 語法 + 平台功能參考

這份統整本站部落格及專案平台支援的所有 markdown 語法，以及透過 inline HTML 達成的進階效果。寫文章卡住時可以打開來抄。

公開渲染管線：`react-markdown` + `remark-gfm`（GitHub Flavored Markdown）+ `rehype-raw`（允許 inline HTML）+ `rehype-highlight`（程式碼語法高亮）。

---

## 1. 標題層級

```
# H1（保留給文章標題，內文不要再用）
## H2
### H3
#### H4
```

效果：

## H2 標題
### H3 標題
#### H4 標題

---

## 2. 基本文字樣式

| 語法 | 效果 |
|------|------|
| `**粗體**` | **粗體** |
| `*斜體*` 或 `_斜體_` | *斜體* |
| `~~刪除線~~` | ~~刪除線~~ |
| `` `inline code` `` | `inline code` |

組合：***又粗又斜***、**`粗體 inline code`**

---

## 3. 顏色（用 inline HTML span）

語法：

```html
<span style="color: #3b82f6">藍字</span>
```

範例（用站內色票會比較統一）：

- <span style="color: #3b82f6">主藍 — 重要連結 / 強調</span>
- <span style="color: #dc2626">警告紅 — FAILED / 錯誤</span>
- <span style="color: #facc15">強調黃 — 注意 / 警語</span>
- <span style="color: #16a34a">成功綠 — PASSED / 通過</span>
- <span style="color: #a3a3a3">中性灰 — 輔助說明</span>
- <span style="color: #f97316">高亮橘 — 次要強調</span>

顏色 + 粗體組合：

- <span style="color: #16a34a; font-weight: bold">✓ Test passed</span>
- <span style="color: #dc2626; font-weight: bold">✗ Test failed</span>
- <span style="color: #facc15; font-weight: bold">⚠ Warning</span>

---

## 4. 高亮與徽章

### 螢光筆高亮（`<mark>`）

```html
<mark>重要片段</mark>
```

效果：今天最重要的學習是 <mark>OpenBMC 的 task scheduling 模型跟 RTOS 的差異</mark>。

### 徽章樣式（圓角背景）

```html
<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">主要</span>
```

範例：

- <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">Primary</span>
- <span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">Public</span>
- <span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">Critical</span>
- <span style="background: #facc15; color: black; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">WIP</span>
- <span style="background: #404040; color: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">Draft</span>

---

## 5. 程式碼

### Inline code

`` `printf("hello")` `` → `printf("hello")`

### Fenced code block（指定語言會自動 syntax highlight）

C：

```c
#include <stdio.h>

int main(void) {
    printf("Hello, BMC\n");
    return 0;
}
```

C++：

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, world\n";
}
```

Python：

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

Bash：

```bash
git status
git add -A
git commit -m "feat: add scheduler"
```

YAML：

```yaml
project:
  name: uav-vio
  language: cpp
  platform: jetson-nano
```

JSON：

```json
{
  "rmse_cm": 3,
  "fps": 30
}
```

支援語言：`c` `cpp` `python` `javascript` `typescript` `bash` `sh` `sql` `yaml` `json` `html` `css` `rust` `go` `java` `kotlin` `swift` `dockerfile`...（rehype-highlight 預設集，幾乎全包）

---

## 6. 列表

### 無序列表

```
- 第一項
- 第二項
  - 巢狀
- 第三項
```

效果：

- 第一項
- 第二項
  - 巢狀
  - 巢狀 2
- 第三項

### 有序列表

1. 第一步
2. 第二步
3. 第三步

### 任務列表（GitHub 風）

- [x] 完成 schema 設計
- [x] 建 admin UI
- [ ] 寫第一篇 case study
- [ ] 部署到 Vercel

---

## 7. 表格

```
| 欄位 1 | 欄位 2 | 欄位 3 |
|--------|:------:|--------:|
| 左對齊 | 置中   | 右對齊  |
```

| 語言 | 用途 | 熟練度 |
|------|:----:|-------:|
| C | 嵌入式 | ★★★★★ |
| C++ | 應用 / 嵌入式 | ★★★★ |
| Python | 工具 / 腳本 | ★★★ |
| Rust | 學習中 | ★ |

---

## 8. 引用與分隔線

引用區塊：

> 「The most damaging phrase in the language is, "we've always done it that way."」
> — Grace Hopper

巢狀引用：

> 一級引用
> > 二級引用

分隔線（三個連字符 `---` 獨佔一行）：

---

## 9. 連結與圖片

### 連結

```
[Anthropic 官方文件](https://docs.claude.com)
```

[Anthropic 官方文件](https://docs.claude.com)

### 自動連結

```
<https://github.com/jamesswim>
```

<https://github.com/jamesswim>

### 圖片（markdown 語法）

```
![alt 文字](https://path/to/image.jpg)
```

### 圖片（HTML，可控制尺寸）

```html
<img src="..." alt="..." style="max-width: 300px; border-radius: 8px" />
```

---

## 10. 可折疊區塊（`<details>`）

寫長文時把次要細節塞 `<details>`，保持主文章節奏：

```html
<details>
  <summary>點我展開</summary>
  細節內容...
</details>
```

效果：

<details>
  <summary>點我展開查看細節</summary>

這段預設折疊，點 summary 才展開。可以塞：

- 列表
- `程式碼`
- **粗體**
- 甚至更多 HTML

```python
print("折疊區裡的程式碼")
```

</details>

---

## 11. 鍵盤按鍵（`<kbd>`）/ 上下標

```html
按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 複製
H<sub>2</sub>O，E = mc<sup>2</sup>
```

效果：

按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 複製，<kbd>Ctrl</kbd> + <kbd>V</kbd> 貼上。

H<sub>2</sub>O，E = mc<sup>2</sup>

---

## 12. Emoji

直接打 emoji 字元（不用語法），系統字型會渲染：

✅ ❌ ⚠️ 💡 🚀 📝 🔧 ⏰ 🎯 🐛 📦 🔬

也可以放 heading：

### 🔧 Setup
### 🐛 Known issues

---

## 13. 站內推薦色票（保持風格一致）

| 用途 | Hex |
|------|-----|
| 主藍 | <span style="color: #3b82f6; font-weight: bold">#3b82f6</span> |
| 警告紅 | <span style="color: #dc2626; font-weight: bold">#dc2626</span> |
| 強調黃 | <span style="color: #facc15; font-weight: bold">#facc15</span> |
| 成功綠 | <span style="color: #16a34a; font-weight: bold">#16a34a</span> |
| 中性灰 | <span style="color: #a3a3a3; font-weight: bold">#a3a3a3</span> |
| 高亮橘 | <span style="color: #f97316; font-weight: bold">#f97316</span> |

---

## 14. 撰文小提醒

- 一篇文章顏色用 **≤ 3 種**，否則整篇花掉
- `<mark>` 適合**提示某句話的重點**，不要整段都套
- 徽章樣式只用在 **inline 標註狀態**（PASSED / FAILED / WIP），不要做大段落
- 標題從 `##` 開始，`#` 留給文章主標題本身
- code block 一定要指定語言（` ```c ` 而非 ` ``` `），否則沒有 highlight
- 想突顯關鍵術語：`<mark>` 或顏色 + 粗體；想標狀態：徽章；想長段警告：用引用 `>` 開頭

---

## 15. 排版範例（對照看效果）

> 💡 **Tip：** 在 BMC 上同時跑 <mark>多個高優先 task</mark> 時，要特別注意 <span style="color: #dc2626; font-weight: bold">priority inversion</span> 問題。實作可以參考下面這個 minimal example：
>
> ```c
> // 注意：scheduler 鎖在 lower priority task 持有時，
> // higher priority task 會被卡住等釋放。
> mutex_lock(&shared_resource);
> ```
>
> 解法：<span style="color: #16a34a; font-weight: bold">priority inheritance</span> 機制 — 當 high priority task 被 lower priority task 阻塞時，暫時把 low priority 的優先度抬高到跟 high priority 一樣，避免被中等優先 task 搶走 CPU。
>
> <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em">Best Practice</span> FreeRTOS / Zephyr 的 mutex 預設都有 priority inheritance，但 raw spinlock 沒有，要自己處理。
