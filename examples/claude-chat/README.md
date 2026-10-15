# 完整聊天实例

这是使用者认可的 v3 视觉起点。`index.html` 和 `assets/` 可以整目录复制到任意静态项目；没有 npm 依赖、服务端或 API Key。

## 运行

在本目录执行 `python3 -m http.server 8080 --bind 127.0.0.1`，打开 http://127.0.0.1:8080 。也可以下载 `standalone.html` 后直接打开，字体和所有页面资源已内嵌。复制与持久化行为建议在 localhost / HTTPS 检查。

## 文件职责

| 文件 | 负责什么 |
| --- | --- |
| [index.html](./index.html) | 页面骨架、导航、搜索/重命名/说明弹窗 |
| [assets/chat.css](./assets/chat.css) | 主题变量、侧栏/阅读列/输入区域、组件、响应式 |
| [assets/chat.js](./assets/chat.js) | 图标、示例状态、消息渲染、模型菜单、附件、生成、搜索与保存 |
| [assets/fonts.css](./assets/fonts.css)、[fonts](./assets/fonts/) | 本地 Inter 字重400/500/600与OFL许可 |
| [assets/interactions.js](./assets/interactions.js) | 来自根目录interaction-examples.js的共享工具副本 |
| [assets/reference.css](./assets/reference.css) | 通用参考CSS副本，chat.css覆盖本实例的视觉 |
| [standalone.html](./standalone.html) | 自动生成的单文件版本；修改源文件后再生成 |

## 常用修改

- **改页面风格**：先看 `chat.css` 开头的变量，保持输入框/侧栏/正文比例；对照根目录 [chat-profile.json](../../chat-profile.json)。
- **改品牌与文案**：`index.html`、`chat.js` 的 `home()` 和 `seed`。换产品时同步本地存储键 `STORE`。
- **接真实模型**：`response()`返回预设内容；`startRun()`用计时器逐字显示。换成后端请求时实现取消、失败恢复、重试和流中断状态，不把密钥写进浏览器。
- **接附件后端**：当前是 `File.text()` 本地读取，不会上传。先定义上传API和状态再修改显示文案。
- **迁移框架**：按Sidebar / Composer / Message / Dialog拆分组件。保留IME、草稿、focus restore和滚动阅读行为，卸载时释放监听和请求。

`data-theme`是主题入口；本实例没有密度切换。模型选择是演示状态，思考区域是固定占位说明，所有回复为预设。`localStorage`只用于当前浏览器，不支持账号和多端同步。

## 维护

在仓库根目录运行：

```sh
python3 scripts/build-deliverables.py
python3 scripts/verify-package.py
```

共享交互改根目录 `interaction-examples.js`，不要只改本目录副本。完整接手规则见根目录 [AGENTS.md](../../AGENTS.md)，实际验证范围见 [VALIDATION.md](./VALIDATION.md)。
