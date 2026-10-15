# Agent 使用指南 · v3

本仓库把一个已经认可的 Claude 风格完整聊天实例，与此前的设计参考和交互工具放在一起。目标是让后续 Agent 直接运行、复制、修改，而不是仅凭风格形容词重新设计。

## 从这里开始

1. 读 `README.md`，确认用户要完整聊天页，还是通用组件。
2. 做 Claude 风格聊天或衍生产品界面时，默认先运行 `examples/claude-chat/index.html`，以它为视觉起点。具体文件职责见同目录 `README.md`。
3. 仅能接收一个附件时，使用 `Claude网页设计参考_v3_Agent.md`：说明与完整文本源码在同一文件。Inter 二进制字体另外随实例附带；缺失时使用系统回退并说明字形差异。
4. 用户需求、现有项目和无障碍约束优先；保留技术栈，避免为了复用而整站重写或安装上游 Electron 组件库。

## 明确选择参考范围

| 范围 | 入口与规则 |
| --- | --- |
| 已认可的聊天实例（默认） | `examples/claude-chat/`、`chat-profile.json`、v3 指南；Inter、本地字体、256px 侧栏、672px 首页输入框、20px 输入框圆角、黏土橙图标发送按钮 |
| 通用组件手册（兼容保留） | `claude-reference.css`、`.claude-ref` / `.cr-*`、v2 HTML / 指南；近黑文字主按钮、舒适/紧凑密度、原始 Figma 颜色登记 |
| 共享交互工具 | 根目录 `interaction-examples.js`、`INTERACTION_API.txt`；保留 `window.ClaudeRefV2` / CommonJS 兼容接口 |
| 来源与证据 | `INTEGRATION_DECISIONS.json`、`tokens.json`、`VERIFICATION.json`、实例 `VALIDATION.md` |

不要把 v2 的侧栏、字号、密度或圆角覆盖到聊天实例。聊天实例使用 `chat.css` 的变量和类，`data-theme="light|dark"` 切换主题，没有密度切换。v2 的 `.cr-*` 规则仅适用于对应手册；两者的验证证据分开记录。

## 保持认可的视觉

- 先保持侧栏、阅读列、输入区域之间的比例，再替换品牌文案和业务内容。不要仅保留暖色背景却改成大卡片仪表盘或营销落地页。
- 本地 Inter 400 / 500 / 600 及 OFL 已随实例附带；中文为系统回退。不存在 Anthropic 专有字体。
- 浅色暖白、灰米色侧栏、轻边框与轻阴影；橙色只用于小面积强调和发送图标，不把所有文字主按钮改成橙底白字。
- `chat-profile.json` 记录实际采用值。它是经认可的实现参数，不是官方 Claude Token 导出。`tokens.json` 的 8 个待核对语义色保持原标记。
- 实例桌面/粗指针控件较紧凑；不要声称它满足 v2 的 44px 触控规则或完整无障碍标准。目标产品需要扩大命中区域时做明确调整并重新检查。
- 品牌化产品改名、换项目图标；不要把演示名称或“示例回复”改成对真实后端能力的虚假承诺。

## 业务与交互边界

- `chat.js` 的 `seed` 与 `response()` 是演示内容，`startRun()` 使用计时器模拟逐步显示。接模型时替换为真实服务调用与取消机制，处理失败、重试、未完成回复和草稿恢复。
- 模型菜单只是本地选择状态。只有真正接入模型后才能称为模型切换。
- 附件由 `File.text()` 在本机读取；未上传。`localStorage` 按来源隔离，不是用户账号、服务端保存或多设备同步。`STORE` 应在复用到新产品时改成独立键。
- 模拟“思考过程”是占位说明。接入后只展示服务实际提供且允许展示的状态/摘要，不伪造模型内部思考。
- `bindComposer()` 处理 IME、自动高度与提交保护；`bindDialog()` 处理原生 dialog 的焦点；`createScrollPinning()` 只提供跟随状态机。参数以 `INTERACTION_API.txt` 为准。
- React/Vue 迁移时将全局 DOM 逻辑转为组件状态，卸载时清理绑定、事件、计时器与请求；不要把示例全局监听重复安装在每次渲染中。
- 原生渲染器是受限 Markdown 示例，不是通用富文本/HTML 渲染器。接真实模型保留转义或使用有适当清理的成熟解析器。

## 修改入口与生成文件

| 要改的部分 | 源文件 |
| --- | --- |
| 页面骨架、导航、弹窗和静态文案 | `examples/claude-chat/index.html` |
| 颜色、字体、比例、组件、响应式 | `examples/claude-chat/assets/chat.css` |
| 会话状态、示例回复、附件、搜索、事件 | `examples/claude-chat/assets/chat.js` |
| 字体加载与许可 | `examples/claude-chat/assets/fonts.css`、`assets/fonts/` |
| 共享输入/滚动/焦点逻辑 | 根目录 `interaction-examples.js` |
| v3 指南说明正文 | `docs/agent-guide-intro.md` |
| 便携 HTML、完整文本指南、共享文件副本、哈希清单 | 运行 `python3 scripts/build-deliverables.py` 生成 |

不要直接编辑 `standalone.html`、v3 指南内的源码块，或示例中的共享 JS/CSS 副本。源码改完先生成，再验证。视觉参数变化时同步 `chat-profile.json` 和截图说明。

## 工作与验证顺序

1. 运行：仓库根目录 `python3 -m http.server 8080 --bind 127.0.0.1`，打开 `/examples/claude-chat/`。
2. 先确认原例能运行，再做业务修改。
3. 执行 `python3 scripts/build-deliverables.py`，然后 `python3 scripts/verify-package.py`。后者包括链接/资源/分发一致性、JS 语法和原有 11 组交互状态测试。
4. 页面变化需浏览器核验：浅深主题、390px 无横向溢出、侧栏抽屉、发送/换行/草稿、搜索、代码复制、生成/停止。IME、屏幕阅读器、物理触屏等未实测项目标为未覆盖。
5. 提供可运行入口、实际改动和验证边界；不要把静态检查当成真实模型调用、登录或持久化的验证。

## 仓库维护

- README 使用 `assets/readme-chat-*.jpg`，来自实际运行的 v3 实例。`source-*.png` 是 Figma 参考，其他 v2 预览不是 v3 截图。
- 临时 Cloudflare 预览和认领 URL 不作为长期运行入口；凭证、个人测试对话和发布配置不放进分发包。`standalone.html` 和本地启动命令是稳定入口。
- 保留来源与许可。共享 API 不因文档升级而改名；不要破坏既有 `ClaudeRefV2` 调用。
- 本指南仅约束参考的复用与维护，不额外授权改账号权限、公开仓库、发送外部消息或购买服务。
