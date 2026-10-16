# v3.2 标题字体验证 · 2026-10-16

本轮范围：Afternoon Display 标题字体、截图取样的浅色颜色、英文欢迎语与可编辑试排页。保留此前聊天交互结构。

- 字体文件已通过 FontTools 解析与 TTF/WOFF2 几何一致性验证；名称、常规字重、ASCII字符覆盖、非空轮廓、上下界及输出摘要通过。
- 浏览器实际加载标题字体，computed style 为 Afternoon Display，桌面40px、390px视口32px；浅深主题均已截图检查。
- 390px 页面无横向溢出，侧栏抽屉可开关；聊天正文仍使用Inter。
- 搜索“防抖”返回对应示例，代码复制反馈“已复制”；Shift+Enter换行、Enter发送、停止后恢复发送按钮、新草稿保留已操作。
- 独立离线试排页载入三组字体；64px大写/混合英文句子无横向溢出，28/40/64px可切换。正文与标题均未出现浏览器字体解析错误。
- 本轮Jev尝试1次决策、0次动作，交回Codex；浏览器操作与核验由Codex完成。

边界：这是单个常规字重的标题实验版；不是完整专业字族，也未验证所有字偶、语言或操作系统。真实IME候选窗口、物理触屏和屏幕阅读器未重测；深色主题不是从截图推导的官方配色。当前界面仍使用本地演示回复。

以下为此前版本的验证记录，时间与范围以各条原记录为准。

---

# Validation — 2026-10-15

- JavaScript syntax: `node --check dist/assets/chat.js` passed.
- Chrome desktop: homepage, actual bundled Inter font, 672 px composer and 20 px radius inspected. No browser console warnings/errors captured in final check.
- Chat: selected Opus, added a built-in attachment, sent a JavaScript question, observed generating and completed states with a code block. A draft typed during generation remained after completion.
- Copy reply, search with Cmd+K, filtered conversation results, Escape close, and theme switching verified through UI.
- Mobile layout: tested in a same-origin iframe with a real 390 × 844 CSS-pixel viewport. Root clientWidth and scrollWidth both 390. Drawer opened and closed on conversation selection; final aria-expanded=false and hidden sidebar inert verified.
- Screenshots: light desktop home, dark desktop chat, light mobile conversation.
- Jev assisted model/attachment navigation: 4 successful UI actions. Codex handled text input, DOM checks, screenshots and independent verification.

The Chrome viewport override did not change the tab dimensions, so the narrow-frame preview was used for mobile layout validation. This is not a physical-device or virtual-keyboard test. The temporary QA wrapper is excluded from deployment.

No real AI backend, authentication, multi-device sync, or real-device keyboard behavior is claimed. Responses are deterministic demo content.

## Repository integration

The approved index.html, chat.css and chat.js are copied without visual or behavior changes. Local font files and the shared dependencies are included. The v2 verification record applies only to its own handbook.

Portable HTML and the single-file Agent guide are generated from these sources. Package checks cover relative links, font payloads, synchronized code, syntax and the existing shared-helper tests. Browser verification of this integrated distribution was completed on 2026-10-15:

- Source entry: Chrome rendered the homepage with actual Inter font, 672 px composer, 1654 px root width and equal scroll width.
- Dark source entry: seeded code conversation rendered, one code block, no horizontal overflow. New desktop light/dark screenshots were captured from this repository.
- Portable HTML served locally: zero external script tags, zero external stylesheet links; all three embedded font payloads match the originals. Sent a demo message, observed completion with a code block, and retained the exact draft typed during generation. No captured console warnings/errors.
- Portable HTML at 390 × 844 CSS pixels in a same-origin iframe: clientWidth=scrollWidth=390; theme switching and drawer open/select/close verified; closed drawer reported aria-expanded=false and inert sidebar. New mobile screenshot captured.
- Jev integration run: 3 decisions, 1 executed action (open the sample code conversation), one low-confidence handoff; Codex handled theme selection, text input, frame interactions and all independent assertions. API time 3915 ms; loop time 4327 ms. No raw page content was sent to Jev.
- Original index.html, chat.css and chat.js remained byte-identical to the approved hosted demo. Packaging adds documentation and generated distribution only.

The portable file was browser-tested over localhost. Its no-external-resource property was checked structurally; file:// clipboard/storage behavior and physical-device behavior remain unverified. Source and portable versions share the same browser-origin localStorage during localhost tests.
