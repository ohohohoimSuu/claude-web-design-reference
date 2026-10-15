# Claude 网页设计参考 v3 · 直接交给 Agent

这份文件用来把一个已认可的 Claude 风格聊天界面交给后续 Agent。你可以把它与自己的网页需求一起发送。Agent 能按末尾的文件路径还原完整文本源码，再改成你的产品。

你会得到：完整聊天页面、浅深主题、手机抽屉导航、会话管理、输入与消息交互，以及明确的样式和业务接入位置。默认使用本地预设回复，不需要 API Key。

如果你能访问仓库，直接使用 `examples/claude-chat/` 更方便。若你只想打开看效果，下载同目录的 `standalone.html`；它已经内嵌字体、样式与脚本。这个文本指南不内嵌字体二进制，缺少字体文件时使用系统回退，不能保证与 Inter 截图的字形完全相同。

## 可以直接发送的需求

```text
请用附带的 v3 指南作为视觉与交互起点，为我实现以下网页：……
先运行提供的实例，再修改业务内容。保留现有技术栈。
保持侧栏与阅读列比例、暖白/深灰表面、字体层级、输入框和消息样式。
交付可运行页面，说明哪些功能是模拟的，检查手机布局与关键操作。
```

## 给 Agent 的执行说明

这份指南的默认对象是使用者已认可的完整聊天实例。先照它实现，再按业务需要调整。不要把“Claude 风格”只理解成米色背景，不要擅自加大型卡片、夸张阴影、营销横幅或装饰性渐变。

仓库仍保留 v2 通用组件手册；它的 `.cr-*` 类、近黑文字主按钮、两档密度和 248px 侧栏是另一套适用范围。v3 的实例以 `chat.css` 为准，不具有密度开关。保留共享交互 API 名称 `ClaudeRefV2`，不要为了文档版本号破坏既有调用。

### 1. 先还原这个可运行起点

将后文各源码块保存为标题标明的文件，保持目录层级。项目根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8080/examples/claude-chat/`。无 npm 依赖。`index.html`、`chat.css` 和 `chat.js` 为页面实现；`reference.css` 与 `interactions.js` 为随包共享依赖。后文还附了共享 API 的详细说明。

字体完整包位于 `examples/claude-chat/assets/fonts/`，包含 Inter 400/500/600 和 OFL 许可。只拿到本指南时，不要伪造字体文件：将 `fonts.css` 留空或移除其引用，保留 `chat.css` 中的系统回退栈即可运行；交付时说明采用回退字体。如从完整仓库复制字体，保留 OFL。

### 2. 视觉基线

| 维度 | 实例采用值与用途 |
| --- | --- |
| 浅色 | 页面 #faf9f6，侧栏 #f0efea，输入表面 #ffffff，正文 #262624，次要文字 #66645f |
| 深色 | 页面 #262624，侧栏 #1f1f1d，输入表面 #30302e，正文 #e9e8e2，次要文字 #b4b2aa |
| 强调 | #d97757，小面积符号和图标发送动作；不要扩展到所有橙底白字文字按钮 |
| 字体 | Inter 400/500/600；中文回退 PingFang SC / Microsoft YaHei；代码用系统等宽 |
| 文字 | 桌面首页标题32；助手正文15/1.8；用户正文14；桌面输入15/21；手机输入16/1.5 |
| 布局 | 桌面侧栏256；1050以下侧栏232；760以下抽屉256；首页外列736含两侧32留白，输入区域672；会话外列784含两侧40留白，正文704 |
| 圆角 | 输入20、消息18、代码11、popover12、dialog14；具体控件以源码为准 |
| 空间 | 控件紧凑、阅读区宽松；保留空白，使用细边框和轻阴影；不要把页面每个区块都装进卡片 |

主题通过 `html[data-theme]` 切换。控制页面宽度和组件尺寸时查实际 CSS，不把桌面最大宽度误认为所有屏幕的固定宽度。

来源：本实例参考用户给的 https://claude-storybook.bystanderss.chatgpt.site/ 并由使用者认可；这些值是实现基线，不是 Anthropic 官方设计参数。原始 Figma 37 色与 8 个待核对项继续保存在 v2 的 `tokens.json`，不要覆盖或冒充已确认值。

### 3. 可以改哪里

| 需求 | 修改位置 |
| --- | --- |
| 品牌名、欢迎语、导航、弹窗 | `index.html`；动态欢迎语也在 `chat.js` 的 `home()` |
| 颜色、字重、比例、断点、组件状态 | `chat.css` 的主题变量和对应选择器；同步仓库 `chat-profile.json` |
| 初始示例对话、按钮提示词 | `chat.js` 的 `seed`、`home()` |
| 真正调用模型 | 替换 `response()` / `startRun()` 的预设和计时器，保留 `send()` 的消息状态流转 |
| 持久化/账号 | 将 `loadState()` / `save()` 接入真实数据层；先定义用户隔离和失败状态 |
| 附件上传 | 替换文件 change 处理，保留类型/大小反馈，按后端实际能力显示进度 |
| 搜索、重命名、导出 | `searchResults()`、rename form、`download()` |

原生实现可整目录复制。已有 React/Vue 项目按组件方式迁移，不强制换框架。共享工具可通过挂载/卸载绑定 DOM；不要在每次渲染时重复添加全局监听。清理计时器、事件、滚动跟随和未完成请求。

### 4. 行为和边界

- 当前回复为本地预设；Sonnet/Opus/Haiku 是选择状态，不代表真实调用。接入后端前保留演示说明。
- 模拟思考折叠内容是固定说明；接入后只显示服务实际提供且允许展示的状态/摘要。
- 附件在浏览器中读取，最多3个、每个100KB，支持txt/md/json；没有服务器上传。已发送的附件文本随对话保存在本地，待发送附件不是持久化附件库。
- 存储键为 `claude-ui-demo.v1`；复制到新产品时换独立键。浏览器存储按域名/端口隔离，换域名不会自动迁移数据。
- Enter发送、Shift+Enter换行，保留IME保护。空白不提交；生成期间只能停止，不能重复发起同一提交。当前演示在发送时清空已提交草稿；接真实网络后要在失败时恢复/保留待重试内容。
- 生成完成时不能覆盖用户刚输入的新草稿。停止请求时保留已生成部分。
- 弹窗用原生dialog和bindDialog提供焦点管理；隐藏侧栏设置inert并同步aria-expanded。
- `createScrollPinning()`提供滚动状态机；示例绑定wheel、scroll、按键。移动触摸、图片延迟布局等真实产品事件仍需补充并验证。不要把基础状态机测试当成全设备滚动验证。
- Markdown渲染是受限示例，输入先转义；不要为展示真实模型返回而直接注入HTML。
- 内嵌/静态版本能显示页面；`file://`下的复制与存储可能受浏览器限制，完整操作用localhost或HTTPS。

### 5. 验收和交付

在真实运行页面检查：浅色首页、深色对话；390px无横向溢出；导航抽屉开关；输入换行/发送；生成时输入的新草稿在结束后保留；停止生成；搜索、重命名；代码复制；附件提示和上限。

实例的粗指针主要控件为40px，部分次级控件更小；它不继承v2的44px规则或完整无障碍结论。用于正式产品时检查并按需求扩大命中范围、补齐焦点/触控和对比度；保留认可的视觉比例，记录调整。

纯逻辑检查不能代替真实输入法、物理触屏、屏幕阅读器或真实模型API测试。交付时列出实际验证与未覆盖项，给可打开的页面或启动命令。

在完整仓库中，修改源码后运行：

```sh
python3 scripts/build-deliverables.py
python3 scripts/verify-package.py
```

便携HTML、本文源码块和共享副本由同一源码生成，不要手工改生成物。临时预览URL/认领凭据不放到源码和文档。

### 6. 来源与许可

视觉参照：用户给的 CDS Storybook；v2参考来源为MCP Apps for Claude Community UI kit和Caho1/open-claude-ui固定提交f4947c62a459f6413ed44b289a8d495962add1a2。交互工具由本项目实现。Inter按SIL OFL提供；上游许可附于后文。

这是非官方参考，不代表Anthropic授权或合作。Claude名称和示意符号用于辨认参考风格；实际产品使用自己的品牌。没有Anthropic专有字体、官方Logo文件或生产样式源码。

## 完整文本源码

以下内容由可编辑实例生成。每段标题就是保存路径。字体二进制按前文处理。

### 文件：examples/claude-chat/index.html

~~~~html
<!doctype html>
<html lang="zh-CN" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Claude 风格的完整聊天界面交互示例。会话、模型菜单、附件、思考过程、消息与深色主题。"><meta name="theme-color" content="#faf9f6"><title>Claude UI Demo</title><link rel="icon" href="assets/favicon.svg"><link rel="stylesheet" href="assets/fonts.css"><link rel="stylesheet" href="assets/reference.css"><link rel="stylesheet" href="assets/chat.css"></head>
<body>
<a class="skip" href="#main-content">跳到聊天内容</a>
<div class="app" id="app">
  <button id="nav-scrim" class="nav-scrim" aria-label="关闭会话导航" tabindex="-1"></button>
  <aside class="sidebar" id="sidebar" aria-label="会话导航">
    <div class="sidebar-brand"><button class="wordmark" data-action="new" aria-label="开始新对话">Claude<span>UI DEMO</span></button><button class="icon-btn" data-action="toggle-nav" aria-label="收起侧栏" title="收起侧栏"><span data-icon="panel"></span></button></div>
    <button class="new-chat" data-action="new"><span data-icon="plus-circle"></span><span>新建对话</span><kbd>⌘ ⇧ O</kbd></button>
    <button class="nav-item" data-action="search"><span data-icon="search"></span><span>搜索对话</span><kbd>⌘ K</kbd></button>
    <button class="nav-item active" data-action="home"><span data-icon="chat"></span><span>聊天</span></button>
    <div class="history-label">最近的对话</div><nav id="history" class="history" aria-label="最近的对话"></nav>
    <div class="sidebar-bottom"><div class="local-hint"><span></span>会话保存在当前浏览器</div><div class="account-row"><button class="account" data-action="about"><span class="avatar">S</span><span><strong>我的工作空间</strong><small>界面交互演示</small></span></button><button class="icon-btn" data-action="theme" id="theme-button" aria-label="切换深色主题" title="切换深色主题"><span data-icon="moon"></span></button></div></div>
  </aside>
  <div class="workspace"><header class="topbar"><div class="topbar-left"><button class="icon-btn open-sidebar" data-action="toggle-nav" aria-label="展开会话导航" aria-controls="sidebar" aria-expanded="false"><span data-icon="panel"></span></button><button id="thread-title" class="thread-title" data-action="rename">新对话<span data-icon="chevron-down"></span></button></div><div class="topbar-right"><span class="demo-badge">UI Demo</span><button class="icon-btn" data-action="export" aria-label="导出当前对话" title="导出当前对话"><span data-icon="download"></span></button></div></header><main id="main-content" tabindex="-1"></main></div>
</div>
<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-heading"><h2 id="search-heading" class="sr-only">搜索对话</h2><div class="search-field"><span data-icon="search"></span><input id="search-input" aria-label="搜索对话内容" placeholder="搜索对话…" autocomplete="off"><button data-action="close-search" class="escape-key">ESC</button></div><div id="search-results"></div><footer>搜索标题与消息内容<span>Enter 打开 · Esc 关闭</span></footer></dialog>
<dialog id="rename-dialog" class="small-dialog" aria-labelledby="rename-heading"><h2 id="rename-heading">重命名对话</h2><form id="rename-form"><label for="rename-input" class="sr-only">对话标题</label><input id="rename-input" class="text-field" maxlength="80" required><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-rename">取消</button><button class="btn ink" type="submit">保存</button></div></form></dialog>
<dialog id="about-dialog" class="small-dialog" aria-labelledby="about-heading"><div class="about-symbol" data-icon="asterisk"></div><h2 id="about-heading">Claude 风格聊天界面</h2><p>这个实例用于体验布局与交互。模型菜单、会话记录、附件和消息操作可用；回复来自本地预设，没有连接真实 AI 模型。</p><p>对话与附件文本只保存在当前浏览器，不上传到服务器。可以导出为 Markdown。</p><div class="dialog-actions"><button class="btn ink" data-action="close-about">了解</button></div></dialog>
<input type="file" id="file-input" accept=".txt,.md,.json" hidden><div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="assets/interactions.js"></script><script src="assets/chat.js"></script>
</body></html>
~~~~

### 文件：examples/claude-chat/assets/fonts.css

~~~~css
@font-face{font-family:Inter;font-style:normal;font-weight:400;font-display:swap;src:url('fonts/inter-400.ttf') format('truetype');}
@font-face{font-family:Inter;font-style:normal;font-weight:500;font-display:swap;src:url('fonts/inter-500.ttf') format('truetype');}
@font-face{font-family:Inter;font-style:normal;font-weight:600;font-display:swap;src:url('fonts/inter-600.ttf') format('truetype');}
~~~~

### 文件：examples/claude-chat/assets/reference.css

~~~~css
/* Claude web reference v2.0 · Figma 2026-10-14 / integration 2026-10-15
 * Source: MCP Apps for Claude Community UI kit v1.1.
 * Color values: visible canvas annotations, not Figma API values.
 * --ref-* sizes, spacing, layout and component aliases are recommendations.
 * Conflicting source annotations are quarantined in tokens.json.
 * No font binaries, Claude logos, production CSS or runtime SDK included.
 */
:root, [data-theme="light"] {
  color-scheme: light;
  --color-background-primary: #ffffff;
  --color-background-secondary: #f5f4ed;
  --color-background-tertiary: #faf9f5;
  --color-background-inverse: #141413;
  --color-background-ghost: rgb(255 255 255 / 0);
  --color-background-disabled: rgb(255 255 255 / .5);
  --color-text-primary: #141413;
  --color-text-secondary: #3d3d3a;
  --color-text-tertiary: #73726c;
  --color-text-inverse: #ffffff;
  --color-text-ghost: rgb(115 114 108 / .5);
  --color-text-info: #3266ad;
  --color-text-danger: #7f2c28;
  --color-text-success: #275b19;
  --color-text-warning: #5a4815;
  --color-border-primary: rgb(31 30 29 / .4);
  --color-border-secondary: rgb(31 30 29 / .3);
  --color-border-tertiary: rgb(31 30 29 / .15);
  --color-border-inverse: rgb(255 255 255 / .3);
  --color-border-ghost: rgb(31 30 29 / 0);
  --color-border-info: #4682d5;
  --color-border-danger: #a73339;
  --color-border-success: #437426;
  --color-border-warning: #805c1f;
  --color-border-disabled: rgb(31 30 29 / .1);
  --color-ring-primary: rgb(20 20 19 / .7);
  --color-ring-secondary: rgb(61 61 58 / .7);
  --color-ring-inverse: rgb(255 255 255 / .7);
  --color-ring-info: rgb(50 102 173 / .5);
  --color-ring-danger: rgb(167 61 57 / .5);
  --color-ring-success: rgb(67 116 38 / .5);
  --color-ring-warning: rgb(128 92 31 / .5);
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-background-primary: #30302e;
  --color-background-secondary: #262624;
  --color-background-tertiary: #141413;
  --color-background-inverse: #faf9f5;
  --color-background-ghost: rgb(48 48 46 / 0);
  --color-background-disabled: rgb(48 48 46 / .5);
  --color-text-primary: #faf9f5;
  --color-text-secondary: #c2c0b6;
  --color-text-tertiary: #9c9a92;
  --color-text-inverse: #141413;
  --color-text-ghost: rgb(156 154 146 / .5);
  --color-text-info: #80aadd;
  --color-text-danger: #ee8884;
  --color-text-success: #7ab948;
  --color-text-warning: #d1a041;
  --color-border-primary: rgb(222 220 209 / .4);
  --color-border-secondary: rgb(222 220 209 / .3);
  --color-border-tertiary: rgb(222 220 209 / .15);
  --color-border-inverse: rgb(20 20 19 / .15);
  --color-border-ghost: rgb(222 220 209 / 0);
  --color-border-info: #4682d5;
  --color-border-danger: #cd5c58;
  --color-border-disabled: rgb(222 220 219 / .1);
  --color-ring-primary: rgb(250 249 245 / .7);
  --color-ring-inverse: rgb(20 20 19 / .7);
  --color-ring-info: rgb(128 170 221 / .5);
  --color-ring-danger: rgb(205 92 88 / .5);
  --color-ring-success: rgb(89 145 48 / .5);
  --color-ring-warning: rgb(168 120 41 / .5);
  --color-border-success: initial; /* unresolved source value */
  --color-border-warning: initial; /* unresolved source value */
  --color-ring-secondary: initial; /* unresolved source value */
}

/* Implementation recommendations below. */
:root {
  --font-sans: "Anthropic Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-serif: "Anthropic Serif", Georgia, "Songti SC", serif;
  --font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  --font-weight-normal: 400; --font-weight-medium: 500;
  --font-weight-semibold: 600; --font-weight-bold: 700;
  --ref-space-4: 4px;
  --ref-space-8: 8px;
  --ref-space-12: 12px;
  --ref-space-16: 16px;
  --ref-space-24: 24px;
  --ref-space-32: 32px;
  --ref-space-48: 48px;
  --ref-space-64: 64px;
  --ref-radius-xs: 4px;
  --ref-radius-sm: 6px;
  --ref-radius-md: 8px;
  --ref-radius-lg: 12px;
  --ref-radius-xl: 16px;
  --ref-radius-full: 9999px;
  --ref-text-xs-size: 12px; --ref-text-xs-leading: 18px;
  --ref-text-sm-size: 14px; --ref-text-sm-leading: 20px;
  --ref-text-md-size: 16px; --ref-text-md-leading: 24px;
  --ref-text-lg-size: 18px; --ref-text-lg-leading: 28px;
  --ref-heading-xs-size: 14px; --ref-heading-xs-leading: 20px;
  --ref-heading-sm-size: 16px; --ref-heading-sm-leading: 24px;
  --ref-heading-md-size: 18px; --ref-heading-md-leading: 26px;
  --ref-heading-lg-size: 20px; --ref-heading-lg-leading: 28px;
  --ref-heading-xl-size: 24px; --ref-heading-xl-leading: 32px;
  --ref-heading-2xl-size: 30px; --ref-heading-2xl-leading: 38px;
  --ref-heading-3xl-size: 36px; --ref-heading-3xl-leading: 44px;
  --ref-sidebar-width: 248px; --ref-rail-width: 56px;
  --ref-chat-max-width: 760px; --ref-workspace-max-width: 1120px;
  --ref-page-padding: 32px; --ref-control-height: 40px;
  --ref-shadow: 0 1px 3px rgb(20 20 19 / .08);
  --ref-motion: 120ms;
}
.claude-ref { font-family: var(--font-sans); color: var(--color-text-primary); background: var(--color-background-tertiary); line-height: 1.5; }
.claude-ref *, .claude-ref *::before, .claude-ref *::after { box-sizing: border-box; }
.cr-btn, .cr-icon-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 36px; padding: 7px 14px; border: 1px solid var(--color-border-tertiary); border-radius: var(--ref-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); font: 500 14px/20px var(--font-sans); cursor: pointer; text-decoration: none; transition: background-color var(--ref-motion), border-color var(--ref-motion); }
.cr-btn--primary { background: var(--color-background-inverse); color: var(--color-text-inverse); border-color: transparent; }
.cr-btn--danger { background: #a73339; color: #fff; border-color: transparent; } /* recommendation derived from annotated border-danger; source danger-fill unresolved */
.cr-btn--small { min-height: 32px; padding: 5px 10px; }
.cr-icon-btn { width: 36px; padding: 7px; background: transparent; }
.cr-btn:hover:not(:disabled), .cr-icon-btn:hover:not(:disabled) { filter: brightness(.95); }
.cr-btn:disabled, .cr-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.cr-btn:focus-visible, .cr-icon-btn:focus-visible, .cr-input:focus-visible, .cr-textarea:focus-visible, .cr-nav-link:focus-visible { outline: 2px solid var(--color-ring-primary); outline-offset: 2px; }
.cr-input, .cr-textarea { display: block; width: 100%; min-height: var(--ref-control-height); padding: 9px 12px; border: 1px solid var(--color-border-tertiary); border-radius: var(--ref-radius-md); color: var(--color-text-primary); background: var(--color-background-primary); font: 400 16px/22px var(--font-sans); }
.cr-input::placeholder, .cr-textarea::placeholder { color: var(--color-text-tertiary); }
.cr-input:disabled, .cr-textarea:disabled { opacity: .45; cursor: not-allowed; }
.cr-input[aria-invalid="true"] { border-color: var(--color-border-danger); }
.cr-textarea { min-height: 120px; resize: vertical; }
.cr-field { display: grid; gap: 8px; }
.cr-field label { font-size: 14px; font-weight: 500; }
.cr-help { margin: 0; color: var(--color-text-secondary); font-size: 12px; }
.cr-error { color: var(--color-text-danger); }
.cr-check, .cr-radio { accent-color: var(--color-border-info); width: 16px; height: 16px; vertical-align: middle; }
.cr-switch { appearance: none; width: 36px; height: 20px; border-radius: 999px; border: 1px solid var(--color-border-secondary); background: var(--color-background-secondary); position: relative; vertical-align: middle; cursor: pointer; }
.cr-switch::before { content: ""; position: absolute; width: 14px; height: 14px; left: 2px; top: 2px; border-radius: 50%; background: var(--color-text-tertiary); transition: transform var(--ref-motion); }
.cr-switch:checked { background: var(--color-border-info); border-color: var(--color-border-info); }
.cr-switch:checked::before { background: #fff; transform: translateX(16px); }
.cr-switch:focus-visible, .cr-check:focus-visible, .cr-radio:focus-visible { outline: 2px solid var(--color-ring-info); outline-offset: 3px; }
.cr-switch:disabled, .cr-check:disabled, .cr-radio:disabled { opacity: .45; cursor: not-allowed; }
.cr-card { padding: 16px; background: var(--color-background-primary); border: 1px solid var(--color-border-tertiary); border-radius: var(--ref-radius-lg); }
.cr-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary); font-size: 14px; font-weight: 500; }
.cr-nav { background: var(--color-background-secondary); padding: 12px; }
.cr-nav-link { display: flex; gap: 8px; align-items: center; padding: 8px 10px; border-radius: var(--ref-radius-sm); color: var(--color-text-secondary); text-decoration: none; font-size: 14px; }
.cr-nav-link[aria-current="page"], .cr-nav-link:hover { background: var(--color-background-primary); color: var(--color-text-primary); }
.cr-shell { display: grid; grid-template-columns: var(--ref-sidebar-width) minmax(0,1fr); min-height: 100dvh; }
.cr-main { min-width: 0; padding: var(--ref-page-padding); }
.cr-reading { max-width: var(--ref-chat-max-width); margin-inline: auto; }
.cr-workspace { max-width: var(--ref-workspace-max-width); margin-inline: auto; }
.cr-message { margin-block: 24px; font-size: 16px; line-height: 1.7; }
.cr-message--user { margin-left: auto; max-width: 85%; width: fit-content; padding: 10px 14px; background: var(--color-background-secondary); border-radius: var(--ref-radius-lg); font: 400 14px/22px var(--font-sans); }
.cr-message--assistant { font-family: var(--font-serif); }
.cr-composer { padding: 16px; border: 1px solid var(--color-border-tertiary); border-radius: var(--ref-radius-xl); background: var(--color-background-primary); box-shadow: var(--ref-shadow); }
.cr-composer textarea { width: 100%; min-height: 64px; border: none; background: transparent; resize: vertical; color: var(--color-text-primary); font: 400 16px/24px var(--font-sans); }
.cr-composer textarea:focus-visible { outline: 2px solid var(--color-ring-primary); outline-offset: 3px; border-radius: 4px; }
.cr-composer-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; }
.cr-send { background: var(--ref-brand-accent); color: white; border-color: transparent; }
.cr-skeleton { height: 16px; background: var(--color-background-secondary); border-radius: 6px; }
@media (max-width: 900px) { .cr-shell { grid-template-columns: 1fr; } .cr-shell > .cr-nav { display: none; } /* Provide an accessible menu trigger in your app. */ }
@media (max-width: 640px) { .cr-main { padding: 16px; } .cr-btn, .cr-icon-btn { min-height: 44px; } .cr-icon-btn { width: 44px; } .cr-message--user { max-width: 92%; } }
@media (prefers-reduced-motion: reduce) { .claude-ref *, .claude-ref *::before { transition: none !important; animation: none !important; } }

/* v2 additions. Values below are project recommendations unless marked upstream.
 * Upstream: Caho1/open-claude-ui @ f4947c62a459f6413ed44b289a8d495962add1a2.
 * Existing --color-* annotations and quarantine are preserved.
 */
:root, [data-theme="light"] {
  --ref-accent-decorative: #d97757; /* upstream_code: cds-theme.css */
  --ref-accent-readable: #a64b32;
  --ref-on-accent-readable: #fff;
  --ref-brand-accent: var(--ref-accent-readable);
  --ref-shadow-rest: 0 1px 3px rgb(20 20 19 / .08);
  --ref-shadow-raised: 0 2px 4px rgb(20 20 19 / .05), 0 6px 16px rgb(20 20 19 / .08);
  --ref-shadow-popover: 0 8px 24px rgb(20 20 19 / .12), 0 0 0 1px var(--color-border-tertiary);
  --ref-shadow: var(--ref-shadow-rest);
}
[data-theme="dark"] {
  --ref-accent-readable: #df9c82;
  --ref-on-accent-readable: #141413;
  --ref-brand-accent: var(--ref-accent-readable);
  --ref-shadow-rest: 0 1px 3px rgb(0 0 0 / .24);
  --ref-shadow-raised: 0 2px 4px rgb(0 0 0 / .2), 0 6px 16px rgb(0 0 0 / .3);
  --ref-shadow-popover: 0 8px 24px rgb(0 0 0 / .4), 0 0 0 1px var(--color-border-tertiary);
  --ref-shadow: var(--ref-shadow-rest);
}
:root, [data-density="comfortable"] {
  --ref-button-height: 36px;
  --ref-button-small-height: 32px;
  --ref-control-height: 40px;
  --ref-control-gap: 8px;
  --ref-card-padding: 16px;
  --ref-composer-padding: 16px;
  --ref-page-padding: 32px;
  --ref-ui-size: 14px;
}
[data-density="compact"] {
  --ref-button-height: 32px;
  --ref-button-small-height: 28px;
  --ref-control-height: 36px;
  --ref-control-gap: 6px;
  --ref-card-padding: 14px;
  --ref-composer-padding: 14px;
  --ref-page-padding: 24px;
  --ref-ui-size: 13px;
}
:root {
  --ref-space-2: 2px; --ref-space-6: 6px; --ref-space-10: 10px;
  --ref-space-14: 14px; --ref-space-20: 20px;
  --ref-radius-control: 8px;
  --ref-radius-attachment: 10px;
  --ref-radius-card: 12px;
  --ref-radius-code: 12px;
  --ref-radius-dialog: 16px;
  --ref-radius-message: 18px;
  --ref-radius-composer: 20px;
  --ref-motion-fast: 120ms;
  --ref-motion-standard: 180ms;
  --ref-motion-panel: 240ms;
  --ref-ease-out: cubic-bezier(.16, 1, .3, 1);
}
.cr-btn, .cr-icon-btn {
  min-height: var(--ref-button-height);
  gap: var(--ref-control-gap);
  padding-block: 4px;
  border-radius: var(--ref-radius-control);
  font-size: var(--ref-ui-size);
  transition: background-color var(--ref-motion-fast) var(--ref-ease-out), border-color var(--ref-motion-fast) var(--ref-ease-out);
}
.cr-btn--small { min-height: var(--ref-button-small-height); padding: 2px 10px; }
.claude-ref [hidden] { display:none !important; }
.cr-btn--micro { min-height: 24px; padding: 2px 8px; font-size: 12px; line-height: 18px; border-radius: 6px; }
.cr-btn--secondary { border-color: transparent; background: var(--color-background-secondary); }
.cr-btn--ghost { border-color: transparent; background: transparent; }
.cr-btn--ghost:hover:not(:disabled) { background: var(--color-background-secondary); }
.cr-btn--accent, .cr-send { background: var(--ref-accent-readable); color: var(--ref-on-accent-readable); border-color: transparent; }
.cr-icon-btn { width: var(--ref-button-height); padding: 4px; }
.cr-input { height: var(--ref-control-height); min-height: var(--ref-control-height); padding-block: 4px; }
.cr-card { border-radius: var(--ref-radius-card); padding: var(--ref-card-padding); }
.cr-composer { border-radius: var(--ref-radius-composer); padding: var(--ref-composer-padding); }
.cr-composer:focus-within { border-color: var(--color-border-secondary); box-shadow: var(--ref-shadow-rest); }
.cr-message--user { border-radius: var(--ref-radius-message); }
.cr-number { font-variant-numeric: tabular-nums; }
.cr-toolbar-container { container-type: inline-size; container-name: cr-toolbar; }
.cr-toolbar { display:flex; align-items:center; gap:var(--ref-control-gap); min-width:0; flex-wrap:wrap; }
.cr-toolbar-title { min-width:0; flex:1 1 120px; overflow-wrap:anywhere; }
.cr-toolbar kbd { font: 12px var(--font-mono); color: var(--color-text-secondary); }
@container cr-toolbar (max-width: 480px) { .cr-toolbar .cr-optional-shortcut { display:none; } }
@container cr-toolbar (max-width: 384px) {
  .cr-toolbar { gap:6px; }
  .cr-toolbar .cr-toolbar-title { flex-basis:100%; }
  .cr-toolbar .cr-btn { flex:1 1 auto; }
}
.cr-dialog { box-sizing:border-box; width:min(440px, calc(100% - 32px)); max-height:calc(100dvh - 32px); overflow:auto; color:var(--color-text-primary); background:var(--color-background-primary); border:1px solid var(--color-border-tertiary); padding:24px; border-radius:var(--ref-radius-dialog); box-shadow:var(--ref-shadow-popover); }
.cr-dialog::backdrop { background:rgb(20 20 19 / .45); }
.cr-dialog-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:24px; }
.cr-dialog h2 { margin:0 0 12px; font:600 20px/28px var(--font-sans); }
.cr-dialog p { font-size:14px; line-height:1.7; }
.cr-field-error { font-size:12px; color:var(--color-text-danger); }
.cr-roving { display:flex; gap:8px; flex-wrap:wrap; }
.cr-roving [aria-pressed="true"] { background:var(--color-background-inverse); color:var(--color-text-inverse); }
@media (max-width:640px), (pointer:coarse) {
  .cr-btn, .cr-btn--small, .cr-btn--micro, .cr-icon-btn { min-height:44px; }
  .cr-icon-btn { width:44px; }
  .cr-input { min-height:44px; }
  .cr-main { padding:16px; }
}
@media (prefers-reduced-motion:reduce) {
  :root { --ref-motion-fast:0ms; --ref-motion-standard:0ms; --ref-motion-panel:0ms; }
  html { scroll-behavior:auto !important; }
  .claude-ref *, .claude-ref *::before, .claude-ref *::after { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
}
~~~~

### 文件：examples/claude-chat/assets/chat.css

~~~~css
:root{--canvas:#faf9f6;--sidebar:#f0efea;--surface:#fff;--hover:#e8e7e2;--selected:#e4e3dd;--ink:#262624;--secondary:#66645f;--muted:#92908a;--border:rgba(25,25,23,.10);--strong-border:rgba(25,25,23,.18);--clay:#d97757;--clay-hover:#c86647;--user:#f0f1f5;--width:256px;--shadow:0 4px 20px rgba(0,0,0,.035),inset 0 0 0 1px var(--border);--popover-shadow:0 10px 28px #00000013,0 0 0 1px #0000000b;--font:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
[data-theme=dark]{--canvas:#262624;--sidebar:#1f1f1d;--surface:#30302e;--hover:#363633;--selected:#3a3a36;--ink:#e9e8e2;--secondary:#b4b2aa;--muted:#88877f;--border:rgba(255,255,245,.10);--strong-border:rgba(255,255,245,.19);--user:#383936;--shadow:0 4px 20px #00000016,inset 0 0 0 1px var(--border);--popover-shadow:0 10px 30px #0005,0 0 0 1px #ffffff13}
*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:14px/1.5 var(--font);-webkit-font-smoothing:antialiased}button,input,textarea{font:inherit}button{color:inherit;cursor:pointer;border:0}button:disabled{cursor:default}a{color:inherit;text-decoration:none}p,h1,h2,h3{margin:0}button:focus-visible,a:focus-visible{outline:2px solid var(--clay);outline-offset:3px}input:focus-visible,textarea:focus-visible{outline:0}svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;display:block;flex-shrink:0}::selection{background:#d9775733}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.skip{position:fixed;left:270px;top:-60px;z-index:99;padding:10px;background:var(--surface);border:1px solid var(--border)}.skip:focus{top:8px}[hidden]{display:none!important}.app{display:grid;grid-template-columns:var(--width) minmax(0,1fr);min-height:100dvh;transition:grid-template-columns 180ms ease}.sidebar{height:100dvh;position:sticky;top:0;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:var(--sidebar);padding:21px 12px 14px;border-right:1px solid rgba(0,0,0,.025)}.sidebar-brand{display:flex;align-items:center;justify-content:space-between;padding:0 7px 0 9px;height:38px;margin-bottom:22px}.wordmark{font:28px/1.1 Georgia,"Times New Roman",serif;letter-spacing:-1.2px;background:none;display:flex;align-items:baseline;gap:8px;padding:0}.wordmark>span{font:8px var(--font);letter-spacing:.9px;color:var(--muted)}.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:transparent;color:var(--secondary);flex-shrink:0}.icon-btn:hover{background:var(--hover);color:var(--ink)}.icon-btn svg{width:17px;height:17px}.new-chat,.nav-item{display:flex;align-items:center;gap:10px;width:100%;height:37px;border-radius:7px;background:transparent;padding:0 12px;text-align:left;font-size:13px}.new-chat{margin-bottom:9px;font-weight:500}.new-chat>svg{color:var(--clay);width:19px;height:19px}.nav-item{color:var(--secondary);margin-bottom:2px}.new-chat:hover,.nav-item:hover,.nav-item.active{background:var(--hover)}.nav-item.active{color:var(--ink)}.nav-item svg{width:17px;height:17px}.new-chat kbd,.nav-item kbd{font:10px var(--font);margin-left:auto;color:var(--muted);opacity:0;transition:opacity 120ms}.new-chat:hover kbd,.nav-item:hover kbd{opacity:1}.history-label{font-size:11px;color:var(--muted);padding:0 12px;margin:28px 0 10px;font-weight:500}.history{display:flex;flex-direction:column;gap:2px;overflow:auto;min-height:0}.history-item{display:block;text-align:left;background:transparent;color:var(--secondary);font-size:12px;line-height:1.5;padding:10px 12px;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:6px}.history-item:hover{background:var(--hover);color:var(--ink)}.history-item.selected{background:var(--selected);color:var(--ink)}.history-empty{padding:9px 12px;color:var(--muted);font-size:12px}.sidebar-bottom{margin-top:auto;padding-top:28px}.local-hint{font-size:10px;color:var(--muted);display:flex;align-items:center;gap:6px;padding:0 12px 15px}.local-hint>span{width:4px;height:4px;border-radius:50%;background:#9c9c91}.account-row{border-top:1px solid var(--border);padding:14px 6px 0;display:flex;gap:8px;align-items:center}.account{display:flex;gap:10px;align-items:center;background:transparent;text-align:left;flex:1;min-width:0}.avatar{display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:#dedad0;color:#686358;font:14px Georgia,serif;flex-shrink:0}.account strong{display:block;font-size:12px;font-weight:500}.account small{display:block;font-size:10px;color:var(--muted);margin-top:2px}.workspace{min-width:0}.topbar{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 25px;gap:14px;position:sticky;top:0;z-index:8;background:var(--canvas)}.topbar-left,.topbar-right{display:flex;align-items:center;gap:10px;min-width:0}.thread-title{display:flex;align-items:center;gap:7px;background:transparent;font-size:13px;font-weight:500;max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:6px 4px;border-radius:6px}.thread-title svg{width:12px;height:12px;color:var(--muted)}.thread-title:hover{background:var(--hover)}.demo-badge{font-size:10px;color:var(--muted);padding:3px 7px;border:1px solid var(--border);border-radius:5px}.open-sidebar,.nav-scrim{display:none}main:focus{outline:none}.welcome{max-width:736px;margin:0 auto;padding:clamp(90px,16vh,170px) 32px 50px}.welcome-title{display:flex;align-items:center;justify-content:center;gap:13px;margin-bottom:35px}.welcome-title>svg{width:34px;height:34px;color:var(--clay);stroke-width:1.7}.welcome-title h1{font:400 32px/1.35 var(--font);letter-spacing:-.7px}.composer{position:relative;border-radius:20px;background:var(--surface);padding:15px 15px 12px;box-shadow:var(--shadow);transition:box-shadow 160ms ease}.composer:hover{box-shadow:0 4px 24px rgba(0,0,0,.05),inset 0 0 0 1px var(--strong-border)}.composer:focus-within{box-shadow:0 4px 24px rgba(0,0,0,.055),inset 0 0 0 1px var(--strong-border),0 0 0 1px var(--strong-border)}.composer textarea{display:block;resize:none;border:0;background:transparent;color:var(--ink);width:100%;min-height:52px;max-height:260px;font:400 15px/21px var(--font);padding:1px 8px 5px}.composer textarea::placeholder{color:#9c9b97}.composer-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}.composer-left{display:flex;align-items:center;gap:7px;min-width:0}.composer-action{height:30px;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 8px;background:transparent;color:var(--secondary);border-radius:6px;font-size:12px;white-space:nowrap}.composer-action:hover{background:var(--hover);color:var(--ink)}.composer-action svg{width:14px;height:14px}.composer-action .down{width:11px;height:11px;color:var(--muted)}.send-btn{width:32px;height:32px;display:grid;place-items:center;background:var(--clay);color:white;border-radius:9px;transition:transform 120ms,background 120ms;flex-shrink:0}.send-btn:hover{background:var(--clay-hover)}.send-btn:active{transform:scale(.95)}.send-btn:disabled{background:#d9775726;color:#fff9;cursor:default}.send-btn svg{width:17px;height:17px;stroke-width:2}.composer-note{font-size:10px;color:var(--muted);margin-top:13px;text-align:center;letter-spacing:.1px}.suggestions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:22px}.suggestion{display:flex;align-items:center;gap:7px;font-size:12px;background:transparent;border:1px solid var(--border);border-radius:8px;height:34px;padding:0 12px;color:var(--secondary);transition:background 120ms,border-color 120ms}.suggestion:hover{background:var(--surface);border-color:var(--strong-border);color:var(--ink)}.suggestion svg{width:14px;height:14px}.home-example{display:block;width:fit-content;margin:27px auto 0;background:transparent;color:var(--muted);font-size:11px}.home-example:hover{color:var(--clay)}.popover-anchor{position:relative}.popover{position:absolute;bottom:39px;left:0;z-index:15;width:288px;padding:6px;border-radius:12px;background:var(--surface);box-shadow:var(--popover-shadow);border:1px solid var(--border)}.popover-title{font-size:10px;color:var(--muted);padding:8px 10px 6px;letter-spacing:.3px}.model-option{display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px;text-align:left;background:transparent;border-radius:7px}.model-option:hover,.model-option.selected{background:var(--hover)}.model-option strong{display:block;font-size:13px;font-weight:500}.model-option small{display:block;font-size:11px;color:var(--muted);margin-top:2px}.model-option svg{width:15px;height:15px;color:var(--clay)}.thinking-option{border-top:1px solid var(--border);padding:12px 10px 8px;margin-top:5px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px}.thinking-option p{font-size:10px;color:var(--muted);margin-top:3px}.toggle{appearance:none;width:29px;height:17px;border-radius:20px;background:#d2d0ca;position:relative;cursor:pointer;flex-shrink:0;transition:background 140ms}.toggle:before{content:"";width:13px;height:13px;background:white;border-radius:50%;position:absolute;top:2px;left:2px;box-shadow:0 1px 2px #0002;transition:transform 140ms}.toggle:checked{background:var(--clay)}.toggle:checked:before{transform:translateX(12px)}.add-menu{width:225px}.add-menu button{display:flex;align-items:center;gap:9px;width:100%;padding:10px 9px;background:transparent;font-size:12px;border-radius:7px;text-align:left}.add-menu button:hover{background:var(--hover)}.add-menu svg{width:16px;height:16px;color:var(--secondary)}.add-menu small{display:block;font-size:10px;color:var(--muted);padding:3px 9px 7px}.attachments{display:flex;gap:8px;overflow:auto;margin-bottom:12px;padding:2px}.attachment{position:relative;display:flex;align-items:center;gap:8px;min-width:140px;max-width:210px;background:var(--canvas);border:1px solid var(--border);border-radius:10px;padding:9px 27px 9px 9px}.attachment-type{width:29px;height:32px;border:1px solid var(--border);border-radius:5px;display:grid;place-items:center;background:var(--surface);font:9px var(--font);color:var(--clay);flex-shrink:0}.attachment strong{display:block;max-width:115px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:500}.attachment small{font-size:9px;color:var(--muted)}.attachment-remove{position:absolute;right:5px;top:5px;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:transparent;color:var(--muted)}.attachment-remove svg{width:11px;height:11px}.attachment-remove:hover{background:var(--hover)}.conversation{max-width:784px;margin:0 auto;padding:34px 40px 0}.messages{display:flex;flex-direction:column;gap:30px;padding-bottom:26px}.user-message{align-self:flex-end;max-width:90%;background:var(--user);border-radius:18px;padding:12px 16px;font-size:14px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}.user-attachments{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px;color:var(--secondary);font-size:10px}.user-attachments>span{display:flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:5px;padding:4px 6px;background:var(--surface)}.user-attachments svg{width:12px;height:12px}.assistant-message{padding:0 2px}.assistant-label{display:flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--secondary);font-size:11px}.assistant-label svg{width:18px;height:18px;color:var(--clay)}.assistant-label .model-badge{font-size:9px;color:var(--muted);margin-left:2px}.message-text{font-size:15px;line-height:1.8;overflow-wrap:anywhere}.message-text p{margin-bottom:16px}.message-text h3{font-size:16px;font-weight:600;margin:23px 0 11px}.message-text ul{margin:10px 0 18px;padding-left:24px}.message-text li{padding-left:2px;margin-bottom:6px}.message-text code{font:12px "SFMono-Regular",Consolas,monospace;background:var(--hover);padding:2px 5px;border-radius:4px}.message-text strong{font-weight:600}.message-actions{display:flex;gap:3px;align-items:center;margin-top:12px}.message-actions .icon-btn{width:28px;height:28px}.message-actions svg{width:14px;height:14px}.message-actions .copy-label{font-size:10px;color:var(--muted);margin-left:5px}.thinking-block{border:1px solid var(--border);border-radius:9px;margin:4px 0 17px;overflow:hidden}.thinking-header{display:flex;align-items:center;gap:8px;padding:10px 12px;width:100%;background:transparent;text-align:left;font-size:12px;color:var(--secondary)}.thinking-header>svg{width:13px;height:13px;margin-left:auto;transition:transform 140ms}.thinking-header[aria-expanded=true]>svg{transform:rotate(180deg)}.thinking-dot{width:5px;height:5px;border-radius:50%;background:var(--clay);animation:breathe 2.4s infinite}.thinking-body{padding:2px 13px 13px;font:11px/1.9 var(--font);color:var(--muted)}.thinking-body>div{padding:3px 0}.code-block{border-radius:11px;overflow:hidden;background:#171716;color:#d9d8d2;margin:18px 0;border:1px solid #30302d}.code-bar{display:flex;justify-content:space-between;align-items:center;padding:8px 13px;background:#20201e;color:#aaa99f;font:11px/1.5 var(--font);border-bottom:1px solid #36362d}.code-bar button{display:flex;align-items:center;gap:5px;background:transparent;color:#b8b7b0;font-size:10px}.code-bar svg{width:12px;height:12px}.code-block pre{padding:14px 16px;margin:0;overflow:auto;font:12px/1.8 "SFMono-Regular",Consolas,monospace;tab-size:2}.code-block pre code{background:none;color:inherit;padding:0;font:inherit}.artifact-card{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border:1px solid var(--border);border-radius:10px;margin:19px 0 4px;background:var(--surface);text-align:left}.artifact-card:hover{border-color:var(--strong-border);box-shadow:0 3px 10px #00000005}.artifact-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:#d9775714;color:var(--clay)}.artifact-card strong{display:block;font-size:12px;font-weight:500}.artifact-card small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.artifact-card>svg{margin-left:auto;width:16px;height:16px;color:var(--muted)}.reply-wrap{position:sticky;bottom:0;padding:18px 0 18px;background:var(--canvas);z-index:5}.reply-wrap:before{content:"";position:absolute;left:0;right:0;top:-22px;height:22px;background:linear-gradient(transparent,var(--canvas));pointer-events:none}.reply-wrap .composer-note{font-size:9px;margin-top:9px}.stop-btn{background:var(--clay);color:white}.stop-btn>span{width:10px;height:10px;background:currentColor;border-radius:2px}.loading-dots{display:flex;gap:4px;padding:10px 0 20px}.loading-dots span{width:5px;height:5px;border-radius:50%;background:var(--clay);animation:breathe 1.2s infinite}.loading-dots span:nth-child(2){animation-delay:160ms}.loading-dots span:nth-child(3){animation-delay:320ms}@keyframes breathe{50%{opacity:.3;transform:translateY(-1px)}}
.search-dialog,.small-dialog{border:1px solid var(--border);border-radius:14px;padding:0;background:var(--surface);color:var(--ink);box-shadow:0 24px 80px #0003;max-width:calc(100% - 32px)}.search-dialog::backdrop,.small-dialog::backdrop{background:#17171455;backdrop-filter:blur(2px)}.search-dialog{width:570px;margin-top:15vh}.search-field{display:flex;align-items:center;gap:12px;padding:19px 21px;border-bottom:1px solid var(--border)}.search-field>svg{color:var(--muted);width:19px;height:19px}.search-field input{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font-size:15px}.escape-key{font-size:9px;color:var(--muted);padding:3px 5px;background:transparent;border:1px solid var(--border);border-radius:4px}#search-results{max-height:380px;overflow:auto;padding:8px}.search-result{display:flex;gap:11px;align-items:center;width:100%;text-align:left;padding:12px;border-radius:8px;background:transparent}.search-result:hover,.search-result:focus{background:var(--hover)}.search-result>svg{width:16px;height:16px;color:var(--secondary)}.search-result strong{display:block;font-size:13px;font-weight:500}.search-result small{font-size:11px;color:var(--muted);display:block;max-width:410px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.search-dialog footer{display:flex;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--border);font-size:10px;color:var(--muted)}.empty-search{padding:35px;text-align:center;color:var(--muted);font-size:13px}.small-dialog{width:420px;padding:27px}.small-dialog h2{font-size:18px;font-weight:600;margin:0 0 18px}.small-dialog p{font-size:13px;line-height:1.85;color:var(--secondary);margin-bottom:12px}.about-symbol{color:var(--clay);margin-bottom:18px}.about-symbol svg{width:28px;height:28px}.text-field{width:100%;height:39px;padding:8px 11px;border:1px solid var(--strong-border);border-radius:7px;background:var(--surface);color:var(--ink);font-size:14px}.text-field:focus{box-shadow:0 0 0 2px #d977571c}.dialog-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:22px}.btn{height:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;padding:0 13px;font-size:12px}.btn.secondary{border:1px solid var(--border);background:var(--surface)}.btn.ink{background:var(--ink);color:var(--surface)}.toast{position:fixed;bottom:25px;left:calc(50% + 100px);transform:translateX(-50%);background:var(--ink);color:var(--surface);font-size:12px;border-radius:8px;padding:10px 15px;box-shadow:0 3px 15px #0002;z-index:100;pointer-events:none;opacity:0;transition:opacity 150ms;max-width:calc(100% - 32px)}.toast.visible{opacity:1}.app.nav-collapsed{--width:0px}.nav-collapsed .sidebar{padding:0;border:0;visibility:hidden}.nav-collapsed .open-sidebar{display:flex}
@media(min-width:1600px){.welcome{padding-top:18vh}.conversation{padding-top:40px}}
@media(max-width:1050px){:root{--width:232px}.welcome{padding:clamp(75px,15vh,140px) 28px 40px}.welcome-title h1{font-size:29px}.conversation{padding-inline:30px}.sidebar-brand{padding-left:8px}.wordmark{font-size:26px}.wordmark>span{font-size:7px}}
@media(max-width:760px){.app,.app.nav-collapsed{display:block}.sidebar,.nav-collapsed .sidebar{position:fixed;left:0;top:0;width:256px;height:100dvh;z-index:40;transform:translateX(-100%);transition:transform 180ms ease;padding:21px 12px 14px;visibility:visible;border-right:1px solid var(--border)}.drawer-open .sidebar{transform:translateX(0)}.nav-scrim{position:fixed;inset:0;z-index:39;background:#1717144a;backdrop-filter:blur(2px);display:none}.drawer-open .nav-scrim{display:block}.open-sidebar{display:flex}.topbar{padding:0 14px;height:56px}.thread-title{font-size:12px;max-width:215px}.topbar-right{gap:6px}.demo-badge{font-size:9px;padding:3px 6px}.topbar-right .icon-btn{display:none}.welcome{padding:clamp(95px,19vh,160px) 20px 40px;max-width:600px}.welcome-title{gap:9px;margin-bottom:28px}.welcome-title h1{font-size:26px;letter-spacing:-.5px}.welcome-title>svg{width:27px;height:27px}.composer{padding:14px 12px 10px;border-radius:20px}.composer textarea{font-size:16px;line-height:1.5;min-height:66px;padding-left:6px}.composer-left{gap:2px}.composer-action{font-size:11px;padding:0 6px;height:34px}.composer-action svg{width:14px;height:14px}.send-btn{width:34px;height:34px}.composer-note{font-size:9px;margin-top:12px}.suggestions{gap:7px;margin-top:19px}.suggestion{height:34px;font-size:11px;padding:0 10px}.suggestion svg{width:13px;height:13px}.home-example{margin-top:24px;font-size:10px}.conversation{padding:23px 20px 0}.messages{gap:25px}.message-text{font-size:15px;line-height:1.85}.user-message{max-width:95%;font-size:14px;padding:11px 15px}.assistant-label{font-size:11px}.reply-wrap{padding-bottom:12px}.popover{width:268px;left:-45px}.add-menu{width:215px;left:0}.search-dialog{margin-top:10vh}.search-dialog footer>span{display:none}.search-result small{max-width:260px}.small-dialog{padding:24px}.toast{left:50%}.code-block pre{font-size:11px}.history-item{padding-block:12px}.new-chat,.nav-item{height:42px}}
@media(pointer:coarse){.icon-btn,.send-btn{width:40px;height:40px}.composer-action{min-height:40px}.suggestion,.btn{min-height:40px}.attachment-remove{width:24px;height:24px}.model-option{min-height:52px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}}

.conversation{display:flex;flex-direction:column;min-height:calc(100dvh - 58px)}.messages{flex:1}.reply-wrap{margin-top:auto}
~~~~

### 文件：examples/claude-chat/assets/interactions.js

~~~~javascript
/* Claude-inspired reference v2 — independently written interaction examples.
 * Patterns informed by Caho1/open-claude-ui (MIT), commit f4947c6.
 * Not an official Claude implementation. No network, model, or tool calls.
 * Requires a modern browser for DOM bindings; pure helpers also run in Node.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ClaudeRefV2 = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  function createCompositionGuard(options) {
    options = options || {};
    var now = options.now || Date.now;
    var cooldownMs = options.cooldownMs == null ? 50 : options.cooldownMs;
    var composing = false;
    var endedAt = -Infinity;
    return {
      start: function () { composing = true; },
      end: function () { composing = false; endedAt = now(); },
      shouldSubmit: function (event, state) {
        state = state || {};
        return event.key === "Enter" && !event.shiftKey && !event.altKey &&
          !event.ctrlKey && !event.metaKey && !event.repeat &&
          !event.defaultPrevented && !event.isComposing &&
          event.keyCode !== 229 && event.which !== 229 && !composing &&
          now() - endedAt >= cooldownMs && !state.disabled &&
          !state.pending && !state.suggestionsOpen &&
          typeof state.value === "string" && state.value.trim().length > 0;
      }
    };
  }

  // Range is [from, to); the full snapshot prevents applying stale suggestions.
  function findSuggestionTrigger(text, caret) {
    if (typeof text !== "string" || !Number.isInteger(caret) ||
        caret < 0 || caret > text.length) return null;
    var match = /(?:^|\s)([@/])([^\s@/]*)$/u.exec(text.slice(0, caret));
    if (!match) return null;
    var from = caret - match[1].length - match[2].length;
    return { sourceText: text, from: from, to: caret, symbol: match[1], query: match[2] };
  }

  function replaceSuggestion(text, trigger, replacement) {
    if (!trigger || typeof text !== "string" || typeof replacement !== "string" ||
        text !== trigger.sourceText || !Number.isInteger(trigger.from) ||
        !Number.isInteger(trigger.to) || trigger.from < 0 ||
        trigger.to < trigger.from || trigger.to > text.length ||
        (trigger.symbol !== "@" && trigger.symbol !== "/") ||
        typeof trigger.query !== "string" ||
        text.slice(trigger.from, trigger.to) !== trigger.symbol + trigger.query) return null;
    return {
      text: text.slice(0, trigger.from) + replacement + text.slice(trigger.to),
      caret: trigger.from + replacement.length
    };
  }

  function createScrollPinning(options) {
    options = options || {};
    var now = options.now || Date.now;
    var cooldownMs = options.cooldownMs == null ? 150 : options.cooldownMs;
    var nearBottomPx = options.nearBottomPx == null ? 40 : options.nearBottomPx;
    var jumpThresholdPx = options.jumpThresholdPx == null ? 120 : options.jumpThresholdPx;
    var pinned = options.initiallyPinned !== false;
    var lastTop = null;
    var releasedAt = -Infinity;
    var latest = { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };

    function measure(metrics) {
      if (metrics) {
        ["scrollTop", "scrollHeight", "clientHeight"].forEach(function (key) {
          if (!Number.isFinite(metrics[key])) throw new TypeError("Invalid scroll metric: " + key);
        });
        latest = {
          scrollTop: Math.max(0, metrics.scrollTop),
          scrollHeight: Math.max(0, metrics.scrollHeight),
          clientHeight: Math.max(0, metrics.clientHeight)
        };
      }
      return Math.max(0, latest.scrollHeight - latest.clientHeight - latest.scrollTop);
    }
    function release() { pinned = false; releasedAt = now(); }
    function getState(metrics) {
      var distance = measure(metrics);
      var remaining = Math.max(0, cooldownMs - (now() - releasedAt));
      return {
        pinned: pinned,
        shouldAutoScroll: pinned && remaining === 0,
        showJumpButton: distance > jumpThresholdPx,
        distanceToBottom: distance,
        cooldownRemainingMs: remaining
      };
    }
    return {
      // Call on wheel/touch/keyboard intent before browser scrolling can occur.
      onUserIntent: function (direction) {
        if (direction === "up") release();
        return getState();
      },
      // Mark application-driven scrolling explicitly; it must not release pinning.
      onScroll: function (metrics, event) {
        event = event || {};
        var distance = measure(metrics);
        var upward = lastTop !== null && latest.scrollTop < lastTop - 0.5;
        if (event.source !== "programmatic") {
          if (upward) release();
          else if (distance <= nearBottomPx && now() - releasedAt >= cooldownMs) pinned = true;
          else if (distance > nearBottomPx) pinned = false;
        }
        lastTop = latest.scrollTop;
        return getState();
      },
      // Call after content changes. Never re-enable pinning merely because time elapsed.
      onContentChange: function (metrics) { return getState(metrics); },
      // After this explicit user action the caller should scroll to the actual bottom.
      jumpToBottom: function () {
        pinned = true;
        releasedAt = -Infinity;
        lastTop = Math.max(0, latest.scrollHeight - latest.clientHeight);
        return getState();
      },
      getState: getState
    };
  }

  function nextRovingIndex(index, key, options) {
    options = options || {};
    var count = options.count;
    if (!Number.isInteger(count) || count <= 0) return -1;
    var orientation = options.orientation || "horizontal";
    var loop = options.loop !== false;
    var columns = Math.max(1, Math.floor(options.columns || 1));
    var rtl = !!options.rtl;
    if (key === "Home") return 0;
    if (key === "End") return count - 1;
    var horizontal = orientation === "horizontal" || orientation === "grid";
    var vertical = orientation === "vertical" || orientation === "grid";
    var step = horizontal && key === "ArrowRight" ? (rtl ? -1 : 1) :
      horizontal && key === "ArrowLeft" ? (rtl ? 1 : -1) :
      vertical && key === "ArrowDown" ? 1 : vertical && key === "ArrowUp" ? -1 : 0;
    var validIndex = Number.isInteger(index) && index >= 0 && index < count;
    if (!step) return validIndex ? index : -1;
    if (!validIndex) return step > 0 ? 0 : count - 1;
    if (orientation === "grid") {
      if (key === "ArrowUp" || key === "ArrowDown") {
        var column = index % columns;
        var candidate = index + step * columns;
        if (candidate >= 0 && candidate < count) return candidate;
        if (!loop) return index;
        return step > 0 ? column : column + Math.floor((count - 1 - column) / columns) * columns;
      }
      var rowStart = Math.floor(index / columns) * columns;
      var rowEnd = Math.min(rowStart + columns - 1, count - 1);
      var adjacent = index + step;
      if (adjacent >= rowStart && adjacent <= rowEnd) return adjacent;
      return loop ? (step > 0 ? rowStart : rowEnd) : index;
    }
    var next = index + step;
    return loop ? (next + count) % count : Math.max(0, Math.min(count - 1, next));
  }

  function bindComposer(textarea, onSubmit, options) {
    options = options || {};
    if (!textarea || textarea.tagName !== "TEXTAREA" || typeof onSubmit !== "function") {
      throw new TypeError("bindComposer requires a textarea and an onSubmit function");
    }
    var guard = createCompositionGuard(options);
    var pending = false;
    var disposed = false;
    var originalBusy = textarea.getAttribute("aria-busy");
    var originalHeight = textarea.style.height;
    var originalOverflow = textarea.style.overflowY;
    var minHeight = options.minHeight == null ? 48 : options.minHeight;
    var maxHeight = options.maxHeight == null ? 240 : options.maxHeight;
    function resize() {
      if (disposed) return;
      textarea.style.height = "auto";
      var view = textarea.ownerDocument.defaultView;
      var style = view.getComputedStyle(textarea);
      var padding = parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);
      var border = parseFloat(style.borderTopWidth || 0) + parseFloat(style.borderBottomWidth || 0);
      var desired = textarea.scrollHeight + (style.boxSizing === "border-box" ? border : -padding);
      textarea.style.height = Math.min(maxHeight, Math.max(minHeight, desired)) + "px";
      textarea.style.overflowY = desired > maxHeight ? "auto" : "hidden";
    }
    function restoreBusy() {
      if (originalBusy === null) textarea.removeAttribute("aria-busy");
      else textarea.setAttribute("aria-busy", originalBusy);
    }
    async function submit() {
      if (disposed || pending || textarea.disabled || textarea.readOnly) return false;
      var originalValue = textarea.value;
      var value = originalValue;
      if (!guard.shouldSubmit({ key: "Enter" }, { value: value })) return false;
      pending = true;
      textarea.setAttribute("aria-busy", "true");
      try {
        var accepted = await onSubmit(value);
        if (disposed) return false;
        if (accepted === false) return false;
        if (textarea.value === originalValue) textarea.value = "";
        resize();
        return true;
      } catch (error) {
        if (!disposed) {
          if (typeof options.onError === "function") options.onError(error);
          else {
            var EventClass = textarea.ownerDocument.defaultView.CustomEvent;
            textarea.dispatchEvent(new EventClass("composererror", { bubbles: true, detail: error }));
          }
        }
        return false;
      } finally {
        pending = false;
        if (!disposed) restoreBusy();
      }
    }
    function onKeyDown(event) {
      if (guard.shouldSubmit(event, {
        value: textarea.value, pending: pending,
        disabled: textarea.disabled || textarea.readOnly,
        suggestionsOpen: typeof options.suggestionsOpen === "function" && options.suggestionsOpen()
      })) {
        event.preventDefault();
        void submit();
      }
    }
    textarea.addEventListener("compositionstart", guard.start);
    textarea.addEventListener("compositionend", guard.end);
    textarea.addEventListener("keydown", onKeyDown);
    textarea.addEventListener("input", resize);
    resize();
    return {
      submit: submit,
      resize: resize,
      isPending: function () { return pending; },
      dispose: function () {
        if (disposed) return;
        disposed = true;
        textarea.removeEventListener("compositionstart", guard.start);
        textarea.removeEventListener("compositionend", guard.end);
        textarea.removeEventListener("keydown", onKeyDown);
        textarea.removeEventListener("input", resize);
        textarea.style.height = originalHeight;
        textarea.style.overflowY = originalOverflow;
        restoreBusy();
      }
    };
  }

  function bindDialog(dialog, options) {
    options = options || {};
    if (!dialog || dialog.tagName !== "DIALOG" || typeof dialog.showModal !== "function") {
      throw new TypeError("Use a native <dialog> in a browser that supports showModal()");
    }
    var doc = dialog.ownerDocument;
    var previousFocus = null;
    var disposed = false;
    var originalTabIndex = dialog.getAttribute("tabindex");
    function checkName() {
      var label = (dialog.getAttribute("aria-label") || "").trim();
      var ids = (dialog.getAttribute("aria-labelledby") || "").trim().split(/\s+/);
      var labelledText = ids.map(function (id) {
        var node = id && doc.getElementById(id);
        return node ? node.textContent.trim() : "";
      }).join(" ").trim();
      if (!label && !labelledText) throw new Error("Dialog needs aria-label or a nonempty aria-labelledby target");
    }
    function restoreFocus() {
      var target = previousFocus;
      previousFocus = null;
      if (target && target.isConnected && typeof target.focus === "function") target.focus({ preventScroll: true });
    }
    function visibleTarget(target) {
      return target && dialog.contains(target) && !target.disabled &&
        !target.matches(":disabled") && !target.closest("[inert], [hidden]") &&
        target.getClientRects().length > 0 &&
        ["hidden", "collapse"].indexOf(doc.defaultView.getComputedStyle(target).visibility) === -1;
    }
    function onKeyDown(event) {
      if (!dialog.open || event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
      // Recompute every time: controls may be added, hidden, disabled or made inert.
      var items = Array.prototype.filter.call(dialog.querySelectorAll("*"), function (node) {
        return node.tabIndex >= 0 && visibleTarget(node);
      });
      if (!items.length) {
        event.preventDefault();
        dialog.setAttribute("tabindex", "-1");
        dialog.focus({ preventScroll: true });
        return;
      }
      var index = items.indexOf(doc.activeElement);
      if (index === -1 || (!event.shiftKey && index === items.length - 1) || (event.shiftKey && index === 0)) {
        event.preventDefault();
        items[event.shiftKey ? items.length - 1 : 0].focus({ preventScroll: true });
      }
    }
    function onClose() {
      // Ignore a queued close from the previous opening if the dialog reopened.
      if (dialog.open) return;
      restoreFocus();
      if (typeof options.onClose === "function") options.onClose(dialog.returnValue);
    }
    checkName();
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("keydown", onKeyDown);
    return {
      showModal: function () {
        if (disposed) throw new Error("Dialog binding was disposed");
        if (dialog.open) return false;
        checkName();
        previousFocus = doc.activeElement;
        dialog.returnValue = "";
        dialog.showModal();
        var target = typeof options.initialFocus === "string" ? dialog.querySelector(options.initialFocus) : options.initialFocus;
        if (!visibleTarget(target)) {
          target = Array.prototype.find.call(dialog.querySelectorAll("[autofocus]:not([disabled])"), visibleTarget);
        }
        if (!target) {
          var candidates = dialog.querySelectorAll("button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex='0']");
          target = Array.prototype.find.call(candidates, visibleTarget);
        }
        if (!target) {
          dialog.setAttribute("tabindex", "-1");
          target = dialog;
        }
        target.focus({ preventScroll: true });
        return true;
      },
      close: function (returnValue) {
        if (!disposed && dialog.open) dialog.close(returnValue == null ? "" : String(returnValue));
      },
      dispose: function () {
        if (disposed) return;
        disposed = true;
        dialog.removeEventListener("close", onClose);
        dialog.removeEventListener("keydown", onKeyDown);
        if (dialog.open) dialog.close();
        restoreFocus();
        if (originalTabIndex === null) dialog.removeAttribute("tabindex");
        else dialog.setAttribute("tabindex", originalTabIndex);
      }
    };
  }

  return {
    createCompositionGuard: createCompositionGuard,
    findSuggestionTrigger: findSuggestionTrigger,
    replaceSuggestion: replaceSuggestion,
    createScrollPinning: createScrollPinning,
    nextRovingIndex: nextRovingIndex,
    bindComposer: bindComposer,
    bindDialog: bindDialog
  };
});
~~~~

### 文件：examples/claude-chat/assets/chat.js

~~~~javascript
'use strict';
const icons={
 panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
 pen:'<path d="m14.5 5.5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 home:'<path d="m3 11 9-7 9 7M5 10v10h5v-6h4v6h5V10"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
 library:'<path d="M4 4h4v16H4zM11 4h3v16h-3zM17 5l3-1 3 15-3 1z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
 'arrow-right':'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 'arrow-up':'<path d="M12 19V5m-6 6 6-6 6 6"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 document:'<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h4M9 12h6m-6 4h6"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 leaf:'<path d="M5 19C1 9 11 3 21 3c0 10-6 20-16 16ZM5 19 15 9"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m4 0h2m-8 3h2"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 book:'<path d="M3 4h6a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H3V4Zm18 0h-6a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h6V4Z"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.document}</svg>`;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hydrate(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);el.removeAttribute('data-icon');});}
Object.assign(icons,{
 'plus-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 chat:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 10 10 0 0 1-4-.8L3 21l1.8-5.5a10 10 0 0 1-.8-4A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"/>',
 'chevron-down':'<path d="m7 10 5 5 5-5"/>',arrow:'<path d="M12 19V5m-5 5 5-5 5 5"/>',
 regenerate:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',
 code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
 lightbulb:'<path d="M8 16a7 7 0 1 1 8 0v3H8v-3Zm1 6h6"/>',
 like:'<path d="M7 10v11H3V10h4Zm0 0 5-8c3 0 2 5 1 8h6a2 2 0 0 1 2 2l-2 9H7"/>',
 asterisk:'<path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5M8.2 2.8l7.6 18.4M2.8 8.2l18.4 7.6M2.8 15.8l18.4-7.6M8.2 21.2l7.6-18.4"/>'
});
hydrate();
const id=()=>crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const STORE='claude-ui-demo.v1';
const layoutReply='一个简洁的产品首页，可以围绕三个问题来组织：\n\n## 1. 这是什么？\n\n用一句话说明产品能解决什么问题。主标题保持明确，让访问者不用猜。\n\n## 2. 它对我有什么帮助？\n\n- 用真实的界面或结果展示价值。\n- 选择两到三个核心能力，减少重复说明。\n- 保留清楚的文字层级和足够的阅读空间。\n\n## 3. 我该如何开始？\n\n给页面一个主要操作，例如「开始使用」或「查看示例」，把次要信息放在后面。\n\n下面是一个简单的结构示例：\n\n```html\n<main>\n  <section class="hero">\n    <h1>让复杂的事情，变得清楚</h1>\n    <p>一句具体的产品介绍。</p>\n    <button>开始使用</button>\n  </section>\n</main>\n```';
const codeReply='防抖的意思是：一件事被连续触发时，等它停下来一小会儿，再执行最后一次。\n\n比如搜索框：用户连续输入时，不必每个字符都发起搜索。等输入暂停 300ms，再处理最新内容。\n\n```javascript\nfunction debounce(fn, delay = 300) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n```\n\n它适合输入搜索、窗口尺寸变化等连续事件。';
const seed={version:1,theme:'light',model:'Sonnet',thinking:true,threads:[
 {id:'demo-layout',title:'设计一个简洁的产品首页',messages:[{id:'u-demo',role:'user',text:'我想做一个简洁的产品首页，应该如何组织内容？',attachments:[]},{id:'a-demo',role:'assistant',text:layoutReply,model:'Sonnet',thinking:true,complete:true}]},
 {id:'demo-js',title:'理解 JavaScript 中的防抖',messages:[{id:'u-js',role:'user',text:'能用简单的例子解释一下防抖吗？',attachments:[]},{id:'a-js',role:'assistant',text:codeReply,model:'Sonnet',thinking:false,complete:true}]},
 {id:'demo-plan',title:'把想法整理成执行清单',messages:[{id:'u-plan',role:'user',text:'我有一个产品想法，帮我整理成可以开始执行的清单。',attachments:[]},{id:'a-plan',role:'assistant',text:'先把计划控制在一周能验证的范围里。\n\n## 一个简单的执行顺序\n\n- 写下目标用户与他们遇到的问题。\n- 选择一个最重要的使用场景。\n- 画出完成这个场景需要的三个页面。\n- 做一个可以实际操作的原型。\n- 请一个真实用户试用，记录卡住的地方。\n\n根据反馈决定下一步，再逐步完善功能。',model:'Sonnet',thinking:false,complete:true}]}]};
function loadState(){try{const d=JSON.parse(localStorage.getItem(STORE));if(d?.version===1&&Array.isArray(d.threads)){d.threads.forEach(t=>t.messages.forEach(m=>{if(m.streaming){delete m.streaming;m.complete=true;m.text=m.text||'上次的示例生成已中断。';}}));return d;}}catch{}return structuredClone(seed);}
let state=loadState(),current=null,attachments=[],binding=null,run=null,toastTimer=null,programmatic=false;
state.drafts ||= {};
const pin=ClaudeRefV2.createScrollPinning();
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch{toast('浏览器存储空间不足，请导出重要对话');}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2400);}
function theme(){document.documentElement.dataset.theme=state.theme;$('#theme-button').innerHTML=icon(state.theme==='dark'?'sun':'moon');const label=state.theme==='dark'?'切换浅色主题':'切换深色主题';$('#theme-button').setAttribute('aria-label',label);$('#theme-button').title=label;}
function sidebarAccess(){const expanded=innerWidth<=760?$('#app').classList.contains('drawer-open'):!$('#app').classList.contains('nav-collapsed');$('#sidebar').inert=!expanded;$('.open-sidebar').setAttribute('aria-expanded',String(expanded));}
function historyList(){$('#history').innerHTML=state.threads.map(t=>`<button class="history-item ${t.id===current?.id?'selected':''}" data-thread="${t.id}" title="${esc(t.title)}">${esc(t.title)}</button>`).join('')||'<p class="history-empty">你的对话会显示在这里</p>';}
function composer(){return `<form class="composer" id="composer"><div class="attachments" id="attachments" ${attachments.length?'':'hidden'}></div><label class="sr-only" for="message-input">输入消息</label><textarea id="message-input" rows="2" maxlength="6000" placeholder="${current?'Reply to Claude…':'How can I help you today?'}"></textarea><div class="composer-footer"><div class="composer-left"><div class="popover-anchor"><button class="composer-action" type="button" data-action="toggle-add" aria-expanded="false" aria-controls="add-menu">${icon('plus')}<span>Add content</span></button><div id="add-menu" class="popover add-menu" hidden><button type="button" data-action="upload">${icon('upload')}上传文本文件</button><button type="button" data-action="sample-file">${icon('document')}添加示例资料</button><small>支持 .txt / .md / .json，最大 100 KB</small></div></div><div class="popover-anchor"><button class="composer-action" id="model-button" type="button" data-action="toggle-model" aria-expanded="false" aria-controls="model-menu"><span id="model-label">${esc(state.model)}</span>${icon('chevron-down')}</button><div id="model-menu" class="popover" hidden><div class="popover-title">选择模型 · 界面演示</div>${[['Sonnet','速度与能力之间的平衡'],['Opus','复杂任务与深入分析'],['Haiku','轻量任务与快速响应']].map(([name,desc])=>`<button type="button" class="model-option ${state.model===name?'selected':''}" data-model="${name}"><span><strong>${name}</strong><small>${desc}</small></span>${state.model===name?icon('check'):''}</button>`).join('')}<label class="thinking-option"><span>Extended thinking<p>展示可折叠的思考过程</p></span><input class="toggle" id="thinking-toggle" type="checkbox" ${state.thinking?'checked':''}></label></div></div></div><button type="${run?'button':'submit'}" class="send-btn ${run?'stop-btn':''}" id="send-button" ${run?'data-action="stop"':'disabled'} aria-label="${run?'停止生成':'发送消息'}">${run?'<span></span>':icon('arrow')}</button></div></form><p class="composer-note">本地 UI 演示 · 回复为预设内容，未连接 AI 模型</p>`;}
function home(){binding?.dispose();current=null;$('#thread-title').innerHTML='新对话'+icon('chevron-down');$('#main-content').innerHTML=`<div class="welcome"><div class="welcome-title">${icon('asterisk')}<h1>今天想聊些什么？</h1></div>${composer()}<div class="suggestions">${[['pen','写作','帮我把一个产品想法整理成清晰的介绍。'],['book','学习','能用简单的例子解释一下一个概念吗？'],['code','代码','请解释 JavaScript 中 debounce 的工作原理。'],['lightbulb','头脑风暴','帮我梳理一个简洁的产品首页方案。']].map(([i,label,p])=>`<button class="suggestion" data-prompt="${p}">${icon(i)}${label}</button>`).join('')}</div><button class="home-example" data-thread="demo-layout">查看一段完整对话示例 →</button></div>`;bindInput();historyList();}
function inline(s){return esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');}
function codeBlock(code,lang,mid){return `<div class="code-block"><div class="code-bar"><span>${esc(lang)}</span><button data-action="copy-code" data-message="${mid}">${icon('copy')}Copy code</button></div><pre><code>${esc(code)}</code></pre></div>`;}
function markdown(text,mid){let out='',list=false,inCode=false,code=[],language='';for(const line of text.split('\n')){if(line.startsWith('```')){if(list){out+='</ul>';list=false;}if(inCode){out+=codeBlock(code.join('\n'),language,mid);inCode=false;code=[];}else{inCode=true;language=line.slice(3)||'text';}continue;}if(inCode){code.push(line);continue;}if(line.startsWith('- ')){if(!list){out+='<ul>';list=true;}out+='<li>'+inline(line.slice(2))+'</li>';continue;}if(list){out+='</ul>';list=false;}if(/^#{1,3} /.test(line))out+='<h3>'+inline(line.replace(/^#{1,3} /,''))+'</h3>';else if(line.trim())out+='<p>'+inline(line)+'</p>';}
if(list)out+='</ul>';if(inCode)out+=codeBlock(code.join('\n'),language,mid);return out;}
function message(m){if(m.role==='user')return `<div class="user-message">${m.attachments?.length?`<div class="user-attachments">${m.attachments.map(f=>`<span>${icon('document')}${esc(f.name)}</span>`).join('')}</div>`:''}${esc(m.text)}</div>`;return `<section class="assistant-message" id="message-${m.id}"><div class="assistant-label">${icon('asterisk')}<span>Claude</span><span class="model-badge">${esc(m.model)} · 示例回复</span></div>${m.thinking?`<div class="thinking-block"><button class="thinking-header" data-action="thinking" aria-expanded="${m.streaming?'true':'false'}"><span class="thinking-dot" style="${m.streaming?'':'animation:none'}"></span>${m.streaming?'Thinking…':'Thought for a moment'}${icon('chevron-down')}</button><div class="thinking-body" ${m.streaming?'':'hidden'}><div>梳理问题中的主要目标</div><div>选择适合的示例结构</div><div>组织清晰、可阅读的回答</div></div></div>`:''}<div class="message-text" id="text-${m.id}">${m.text?markdown(m.text,m.id):'<div class="loading-dots"><span></span><span></span><span></span></div>'}</div>${m.complete?`<div class="message-actions"><button class="icon-btn" data-action="copy" data-message="${m.id}" aria-label="复制回复" title="复制回复">${icon('copy')}</button><button class="icon-btn" data-action="like" data-message="${m.id}" aria-label="标记有帮助" title="标记有帮助">${icon(m.liked?'check':'like')}</button><button class="icon-btn" data-action="regenerate" data-message="${m.id}" aria-label="重新生成示例" title="重新生成示例">${icon('regenerate')}</button></div>`:''}</section>`;}
function chat(){binding?.dispose();$('#thread-title').innerHTML=esc(current.title)+icon('chevron-down');$('#main-content').innerHTML=`<div class="conversation"><div id="messages" class="messages">${current.messages.map(message).join('')}</div><div class="reply-wrap">${composer()}</div></div>`;bindInput();historyList();}
function showAttachments(){const node=$('#attachments');if(!node)return;node.hidden=!attachments.length;node.innerHTML=attachments.map((f,i)=>`<div class="attachment"><span class="attachment-type">${esc(f.name.split('.').pop().toUpperCase().slice(0,4))}</span><span><strong>${esc(f.name)}</strong><small>${Math.max(1,Math.round(f.text.length/1024))} KB · 本地文本</small></span><button type="button" class="attachment-remove" data-remove="${i}" aria-label="移除 ${esc(f.name)}">${icon('x')}</button></div>`).join('');}
function syncSend(){if($('#send-button')&&!run)$('#send-button').disabled=!$('#message-input').value.trim();}
function closeMenus(){document.querySelectorAll('.popover').forEach(e=>e.hidden=true);document.querySelectorAll('[aria-controls="model-menu"],[aria-controls="add-menu"]').forEach(e=>e.setAttribute('aria-expanded','false'));}
function bindInput(){const input=$('#message-input');const draftKey=current?.id||'new';input.value=state.drafts[draftKey]||'';binding=ClaudeRefV2.bindComposer(input,text=>{if(run)return false;state.drafts[draftKey]='';input.value='';send(text);return true;},{minHeight:52,maxHeight:260,onError:()=>toast('暂时无法完成，请再试一次')});input.addEventListener('input',()=>{state.drafts[draftKey]=input.value;syncSend();});$('#composer').addEventListener('submit',e=>{e.preventDefault();if(!run)void binding.submit();});$('#thinking-toggle').addEventListener('change',e=>{state.thinking=e.target.checked;save();});showAttachments();syncSend();}
function metrics(){return{scrollTop:scrollY,scrollHeight:document.documentElement.scrollHeight,clientHeight:innerHeight};}
function follow(){if(pin.onContentChange(metrics()).shouldAutoScroll){programmatic=true;scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});pin.onScroll(metrics(),{source:'programmatic'});requestAnimationFrame(()=>programmatic=false);}}
function response(text,variant=0,files=[]){if(/代码|javascript|debounce/i.test(text))return (variant?'换一种角度，我们把它看作一个“重新计时”的过程。\n\n':'这里用一个防抖函数，演示代码解释的排版与交互。\n\n')+codeReply;
if(/首页|界面|设计/.test(text))return (variant?'我们换一个更直接的组织方式。\n\n':'')+layoutReply;
return (variant?'我们换一个更容易开始的结构。\n\n':'当然。我们可以先从一个清晰、可执行的结构开始。\n\n')+(files.length?`你添加了 ${files.length} 个本地文本附件。这个演示不会将附件发送到模型。\n\n`:'')+'## 先明确你想完成什么\n\n'+text.slice(0,160)+'\n\n## 把任务拆成三步\n\n- **目标**：用一句具体的话，说明最终希望得到什么结果。\n- **结构**：先列出需要的几个部分，再补充每一部分的内容。\n- **验证**：选择一个真实使用场景，检查结果是否清楚、可用。\n\n## 一个可以立即开始的动作\n\n写下最重要的问题，再选一条你已经掌握的材料。先完成一个小版本，然后根据反馈调整。\n\n以上为本地预设内容，用于体验聊天界面。你可以复制或导出这段对话。';}
function send(text){if(run||!text.trim())return;let t=current;if(!t){t={id:id(),title:text.trim().replace(/\s+/g,' ').slice(0,34),messages:[]};state.threads.unshift(t);current=t;}t.messages.push({id:id(),role:'user',text,attachments:attachments.map(f=>({...f}))});const files=attachments;attachments=[];const m={id:id(),role:'assistant',text:'',model:state.model,thinking:state.thinking,streaming:true,complete:false};t.messages.push(m);save();history.replaceState(null,'','#chat/'+t.id);startRun(t,m,response(text,0,files));}
function startRun(t,m,text){run={threadId:t.id,messageId:m.id,timer:null};chat();pin.jumpToBottom();follow();run.timer=setTimeout(()=>{if(!run)return;let cursor=0;run.timer=setInterval(()=>{if(!run)return;cursor=Math.min(text.length,cursor+8);m.text=text.slice(0,cursor);if(current?.id===t.id){const node=$('#text-'+m.id);if(node)node.innerHTML=markdown(m.text,m.id);follow();}if(cursor>=text.length)finishRun(t,m);},22);},state.thinking?650:250);}
function finishRun(t,m){if(run)clearInterval(run.timer);run=null;m.complete=true;delete m.streaming;save();if(current?.id===t.id){chat();follow();}}
function stopRun(){if(!run)return;const t=state.threads.find(t=>t.id===run.threadId),m=t?.messages.find(m=>m.id===run.messageId);clearTimeout(run.timer);clearInterval(run.timer);run=null;if(m){m.complete=true;delete m.streaming;if(!m.text)m.text='示例生成已停止。';}save();if(current)chat();}
function navigate(threadId){save();closeMenus();$('#app').classList.remove('drawer-open');sidebarAccess();const t=state.threads.find(t=>t.id===threadId);if(t){current=t;history.replaceState(null,'','#chat/'+t.id);chat();pin.jumpToBottom();follow();}else{current=null;history.replaceState(null,'','#new');home();scrollTo({top:0,behavior:'instant'});}}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'-');a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('已准备导出 Markdown');}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('已复制');}catch{toast('浏览器未允许复制，可以导出对话');}}
const search=ClaudeRefV2.bindDialog($('#search-dialog'),{initialFocus:'#search-input'}),rename=ClaudeRefV2.bindDialog($('#rename-dialog'),{initialFocus:'#rename-input'}),about=ClaudeRefV2.bindDialog($('#about-dialog'));
function searchResults(){const q=$('#search-input').value.trim().toLowerCase();const matches=state.threads.filter(t=>!q||(t.title+' '+t.messages.map(m=>m.text).join(' ')).toLowerCase().includes(q));$('#search-results').innerHTML=matches.length?matches.map(t=>`<button class="search-result" data-search-thread="${t.id}">${icon('chat')}<span><strong>${esc(t.title)}</strong><small>${esc(t.messages.find(m=>m.role==='user')?.text||'')}</small></span></button>`).join(''):'<p class="empty-search">没有找到相关对话</p>';}
$('#search-input').addEventListener('input',searchResults);$('#search-input').addEventListener('keydown',e=>{if(e.isComposing||e.keyCode===229)return;if(e.key==='Enter'){e.preventDefault();$('#search-results button')?.click();}if(e.key==='ArrowDown'){e.preventDefault();$('#search-results button')?.focus();}});
$('#search-results').addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const all=[...$('#search-results').querySelectorAll('button')];all[ClaudeRefV2.nextRovingIndex(all.indexOf(document.activeElement),e.key,{count:all.length,orientation:'vertical'})]?.focus();});
$('#rename-form').addEventListener('submit',e=>{e.preventDefault();if(current){current.title=$('#rename-input').value.trim()||current.title;save();historyList();$('#thread-title').innerHTML=esc(current.title)+icon('chevron-down');}rename.close();});
$('#file-input').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(!/\.(txt|md|json)$/i.test(f.name)||f.size>102400){toast('请选择 100 KB 以内的文本文件');e.target.value='';return;}if(attachments.length>=3){toast('每次最多添加 3 个附件');e.target.value='';return;}try{attachments.push({name:f.name,text:await f.text()});showAttachments();toast('文本已添加，仅保存在本地');}catch{toast('无法读取该文件');}e.target.value='';});
document.addEventListener('click',async e=>{
const s=e.target.closest('[data-search-thread]');if(s){search.close();navigate(s.dataset.searchThread);return;}const th=e.target.closest('[data-thread]');if(th){navigate(th.dataset.thread);return;}
const prompt=e.target.closest('[data-prompt]');if(prompt){$('#message-input').value=prompt.dataset.prompt;state.drafts[current?.id||'new']=prompt.dataset.prompt;binding.resize();syncSend();$('#message-input').focus();return;}
const remove=e.target.closest('[data-remove]');if(remove){attachments.splice(Number(remove.dataset.remove),1);showAttachments();return;}
const model=e.target.closest('[data-model]');if(model){state.model=model.dataset.model;save();$('#model-label').textContent=state.model;document.querySelectorAll('[data-model]').forEach(b=>{b.classList.toggle('selected',b.dataset.model===state.model);b.querySelector('svg')?.remove();if(b.dataset.model===state.model)b.insertAdjacentHTML('beforeend',icon('check'));});closeMenus();$('#model-button').focus();return;}
const a=e.target.closest('[data-action]');if(!a){if(!e.target.closest('.popover-anchor'))closeMenus();return;}const action=a.dataset.action;
if(action==='new'||action==='home'){stopRun();attachments=[];navigate(null);}
if(action==='search'){$('#search-input').value='';searchResults();search.showModal();}if(action==='close-search')search.close();
if(action==='rename'){if(!current){toast('发送一条消息后，可以重命名对话');return;}$('#rename-input').value=current.title;rename.showModal();}if(action==='close-rename')rename.close();
if(action==='about')about.showModal();if(action==='close-about')about.close();if(action==='theme'){state.theme=state.theme==='dark'?'light':'dark';theme();save();}
if(action==='toggle-nav'){if(innerWidth<=760)$('#app').classList.toggle('drawer-open');else $('#app').classList.toggle('nav-collapsed');sidebarAccess();}
if(action==='toggle-add'||action==='toggle-model'){const node=action==='toggle-add'?$('#add-menu'):$('#model-menu');const open=node.hidden;closeMenus();node.hidden=!open;a.setAttribute('aria-expanded',String(open));}
if(action==='upload'){closeMenus();$('#file-input').click();}
if(action==='sample-file'){if(attachments.length<3)attachments.push({name:'product-brief.md',text:'# 产品说明\n目标：构建一个清晰、易用的聊天界面。\n关注：输入、消息、会话导航和深色主题。'});else toast('每次最多 3 个附件');closeMenus();showAttachments();}
if(action==='stop')stopRun();if(action==='thinking'){const expanded=a.getAttribute('aria-expanded')==='true';a.setAttribute('aria-expanded',String(!expanded));a.nextElementSibling.hidden=expanded;}
if(action==='export'){if(!current){toast('先打开或开始一段对话');return;}download(current.title+'.md','# '+current.title+'\n\n'+current.messages.map(m=>'## '+(m.role==='user'?'User':'Claude · 本地示例')+'\n\n'+m.text).join('\n\n'));}
if(['copy','copy-code','like','regenerate'].includes(action)){const m=current?.messages.find(m=>m.id===a.dataset.message);if(!m)return;if(action==='copy')await copy(m.text);if(action==='copy-code')await copy(a.closest('.code-block').querySelector('pre').textContent);if(action==='like'){m.liked=!m.liked;save();a.innerHTML=icon(m.liked?'check':'like');toast(m.liked?'已标记为有帮助':'已取消标记');}if(action==='regenerate'){if(run)return;const index=current.messages.indexOf(m),u=[...current.messages.slice(0,index)].reverse().find(x=>x.role==='user');m.variant=(m.variant||0)+1;m.text='';m.complete=false;m.streaming=true;startRun(current,m,response(u?.text||'',m.variant,u?.attachments||[]));}}
});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#search-input').value='';searchResults();if(!$('#search-dialog').open)search.showModal();}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='o'){e.preventDefault();stopRun();attachments=[];navigate(null);}if(e.key==='Escape'){closeMenus();$('#app').classList.remove('drawer-open');sidebarAccess();}if(['PageUp','Home','ArrowUp'].includes(e.key)&&!['TEXTAREA','INPUT'].includes(document.activeElement.tagName))pin.onUserIntent('up');});
window.addEventListener('wheel',e=>{if(e.deltaY<0)pin.onUserIntent('up');},{passive:true});window.addEventListener('scroll',()=>pin.onScroll(metrics(),{source:programmatic?'programmatic':'user'}),{passive:true});window.addEventListener('resize',sidebarAccess);$('#nav-scrim').addEventListener('click',()=>{$('#app').classList.remove('drawer-open');sidebarAccess();});window.addEventListener('pagehide',()=>{stopRun();binding?.dispose();save();});
theme();navigate(location.hash.startsWith('#chat/')?location.hash.slice(6):null);sidebarAccess();
~~~~

### 文件：examples/claude-chat/assets/favicon.svg

~~~~xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#d97757"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><path d="M16 6v20M6 16h20M9 9l14 14M9 23 23 9M12 7l8 18M7 12l18 8M7 20l18-8M12 25l8-18"/></g></svg>
~~~~

## 共享交互 API

~~~~text
Claude 网页设计参考 v2：独立编写的无依赖交互示例
借鉴 Caho1/open-claude-ui 的交互模式（f4947c6），不是 Claude 官方实现；未复制上游函数源码。
脚本本身无网络、模型或工具调用，所有示例均在本机运行。

加载：<script src="interaction-examples.js"></script>，使用 globalThis.ClaudeRefV2。
Node：const api = require('./interaction-examples.js')。
浏览器需支持原生 dialog.showModal()；不支持时应使用成熟可访问性组件库，不退化为 div 模拟弹窗。

1. createCompositionGuard({ now=Date.now, cooldownMs=50 }?)
返回 { start(), end(), shouldSubmit(event, {value,disabled?,pending?,suggestionsOpen?}) }。
start/end 绑定 compositionstart/compositionend。中文选字过程中、结束后50ms、isComposing、keyCode/which=229、长按重复事件、已被处理的事件、空输入、pending/disabled、建议菜单打开时均不发送。
仅无修饰键 Enter 发送；Shift+Enter 留给原生换行。50ms 是本参考的实现建议，并非官方常数；仍须在目标浏览器实测真实输入法。

2. findSuggestionTrigger(text, caret) => trigger|null
trigger={sourceText,from,to,symbol,query}；索引使用 UTF-16（与 textarea.selectionStart 一致），范围为[from,to)。
仅文本开头或空白之后的 @ 或 / 激活；email 内部 @ 不激活；只扫描光标之前。
3. replaceSuggestion(text, trigger, replacement) => {text,caret}|null
replacement 原样替换触发范围，后缀保留；要加空格请在 replacement 显式包含它。
任何源文本变化、错误范围或触发文本不匹配都返回 null：重新运行 findSuggestionTrigger，再生成菜单。该纯函数没有当前DOM光标信息；点击建议前宿主还需确认 selectionStart===selectionEnd===trigger.to，光标已移动则重新检测或取消。
接入时先关闭建议菜单，设置 textarea.value/selectionStart/selectionEnd，调用 composer.resize()。
Escape 仅关闭菜单而不发送；上下键选项移动由 nextRovingIndex 管理，菜单消费的 keydown 必须 preventDefault。

4. createScrollPinning({now=Date.now,cooldownMs=150,nearBottomPx=40,jumpThresholdPx=120,initiallyPinned=true}?)
metrics={scrollTop,scrollHeight,clientHeight}，均为有限数值。
返回：
  onUserIntent('up'|'down') => state
  onScroll(metrics,{source:'user'|'programmatic'}?) => state
  onContentChange(metrics) => state
  jumpToBottom() => state
  getState(metrics?) => state
state={pinned,shouldAutoScroll,showJumpButton,distanceToBottom,cooldownRemainingMs}。
wheel向上/touch向上滚动意图/键盘向上翻阅时立即调用onUserIntent('up')，随后scroll用onScroll。
用户向上滚动取消追尾；150ms冷却期后，用户滚回距底部<=40px才恢复。时间流逝或新增内容不会自行恢复追尾。
新增内容后只在onContentChange(...).shouldAutoScroll时设置scrollTop=scrollHeight。应用发起的scroll必须传source:'programmatic'，否则不能区分它与用户滚动。
showJumpButton在离底>120px时显示。点击“回到底部”先jumpToBottom，再实际滚动并以programmatic上报。
这些阈值是第三方模式经修订后的本参考默认值。状态机不绑定DOM，需由使用方接线；触屏滚动、快速流式输出、滚动容器缩放必须实测。

5. nextRovingIndex(index,key,{count,orientation='horizontal',columns=1,rtl=false,loop=true}) => number
orientation为horizontal、vertical或grid。Home/End定位整个集合的首/末项。
grid上下键按columns移动并在同列绕回，左右键在当前行绕回，支持最后一行不满。rtl仅反转左右方向，不改变上下。
count<=0返回-1；index=-1时前向进入0、后向进入末项。调用方负责focus()及唯一tabindex=0，其余为-1。
仅把可用项传给此函数；跳过disabled项应先建立可用索引映射。不要给普通链接列表未经考虑就加roving tabindex。

6. bindComposer(textarea,onSubmit,{minHeight=48,maxHeight=240,now?,cooldownMs=50,suggestionsOpen?:()=>boolean,onError?}?)
onSubmit(text)可同步或异步；返回false保留草稿，其他成功返回清空原草稿。提交期间防重复；用户期间新写的内容不被清除。
返回 { submit():Promise<boolean>,resize(),isPending(),dispose() }。
自动绑定composition/keydown/input，自动高度，Shift+Enter原生换行；aria-busy表示异步提交状态。
发送按钮调用submit()。此方法也拒绝输入法组合/结束冷却期、空白、disabled、readOnly及重复提交；非空内容保留原本的前后空格和换行。
onError接收失败；未设置时派发冒泡composererror CustomEvent（detail为错误）。宿主应呈现可读的失败提示，允许重试。
dispose移除监听、恢复style和aria-busy；调用后尚未完成的请求不再改DOM，但不取消宿主请求。
注意：脚本内没有后端。onSubmit决定数据去向，示例只做本地展示。

7. bindDialog(dialog,{initialFocus?:selector|HTMLElement,onClose?}?)
必须是原生<dialog>，具有aria-label或指向非空文本的aria-labelledby，否则立即报错。
返回 { showModal():boolean,close(returnValue?),dispose() }。
原生showModal负责模态、背景inert和Escape；绑定提供显式Tab边界兜底，并负责初始焦点、关闭后恢复触发点、监听销毁。
弹窗打开时，每次Tab都重新收集可见、enabled、tabIndex>=0且不在hidden/inert子树的控件；末项Tab到首项，首项Shift+Tab到末项，焦点不在列表则按方向接回。无控件则聚焦dialog。dispose同步移除keydown监听。使用DOM顺序和tabindex=0/-1，避免正数tabindex。
initialFocus优先使用安全操作（例如“取消”）；否则先独立查找有效autofocus，再回退首个可见且可用的原生可聚焦项，无可聚焦项时聚焦dialog。autofocus优先级不受普通按钮的DOM顺序影响。
onClose接收dialog.returnValue。关闭按钮可调用close('cancel')，或使用form method="dialog"。
不绑定“点击外部关闭”，防止误关包含未保存输入的弹窗。关闭后触发点已删除时不强行聚焦其他元素。

验证：node interaction-tests.cjs。
Node 测试覆盖纯状态逻辑；不能证明浏览器的实际输入法、焦点限制、触屏滚动或自动高度表现。
~~~~

## Inter 字体许可

~~~~text
Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
~~~~

## 上游许可

~~~~text
MIT License

Copyright (c) 2026 Caho1

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
~~~~
