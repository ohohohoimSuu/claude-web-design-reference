# CDS 2.0 组件参考

这是参考库 3.1 的可选模块，包含五档推理选择、独立输入框底栏、失败消息提示和三个 CSS 动效。打开 `index.html` 运行；`standalone.html` 是脚本生成的单文件版，包含字体与全部依赖，可以离线查看。

来源为 Caho1/open-claude-ui 的固定提交 [f504349](https://github.com/Caho1/open-claude-ui/tree/f504349419118a32804ce3a7fae74593070bf945)。代码在本项目中独立实现，数据接口、键盘行为与减少动态效果处理以本目录为准。尺寸是参考实现值；没有把上游的逆向推断当作已经核验的官方设计规范。

## 取用文件

| 文件 | 用途 |
| --- | --- |
| `components.css` | `.cds2-reference` 范围内的主题、输入框、底栏、档位菜单和动效；不会覆盖原聊天页 |
| `components.js` | `window.ClaudeCDS2` / CommonJS；推理状态与 DOM 绑定，不含业务调用 |
| `index.html` | 可复制的 HTML 结构与完整预览入口 |
| `preview.css`、`preview.js` | 本预览的布局、示例状态与操作；产品接入时按需替换 |
| `../../interaction-examples.js` | 已有 `ClaudeRefV2.bindComposer()`，负责输入法保护与提交行为 |

运行整个仓库：`python3 -m http.server 8080 --bind 127.0.0.1`，打开 `/examples/cds2-components/`。字体复用已有实例的 Inter；单独取用组件时可以直接使用系统回退，不需要下载字体。

## 绑定推理选择器

复制 `index.html` 中的 `details.cds2-effort`，放入 `.cds2-reference` 容器后加载 CSS / JS。原生 `summary` 负责展开，内部原生 radio 负责方向键选择；菜单在上下可用空间之间选择位置，点击外部、焦点移出或 Escape 关闭，Escape 与“完成”将焦点交回入口。

```js
const picker = ClaudeCDS2.bindEffortPicker(element, {
  value: 'high',
  levels: ['low', 'medium', 'high', 'xhigh', 'max'],
  recommended: 'high',
  locked: false,
  onChange(state) { console.log(state.value); }
});
// 模型能力变化：显式传入支持的集合与推荐档位。
picker.configure({ levels: ['low', 'high'], recommended: 'high' });
picker.configure({ locked: true });
picker.get();
// React / Vue 卸载时调用，清理事件与 ResizeObserver。
picker.dispose();
```

`configure()` 会校验完整配置，不接受空集合、重复项、未知档位或不在集合中的推荐值；校验失败时保留原状态。原选项不再可用时回退到新的推荐档位并触发 `onChange`。锁定只阻止用户切换，业务层仍可显式更新模型能力。这里的档位名称不能直接假定适用于所有模型 API，应通过能力适配层映射。

同页多个选择器的 radio 分组名由绑定器独立生成。每个选择器要使用独立的标题 ID 与 `aria-labelledby`。`dispose()` 后不应继续复用绑定实例。

## 输入框与状态

- `.cds2-composer` 采用 12px 圆角；`.cds2-chin` 是独立底栏，桌面按钮最小 36px，手机或粗指针主要控件最小 44px。上游提及的 28px 是行内内容尺度，不作为触控命中范围。
- `bindComposer()` 沿用输入法守卫、Enter 提交、Shift+Enter 换行、异步提交防重复与新草稿保护。
- 本地预览提交只在页面输出收到的文本、档位和示例附件名，不调用模型，不写本地存储。
- `cds2-queue` 仅负责显示失败计数与操作入口。预览中的两条失败消息和“重试”都是显式标注的示例；未实现 IndexedDB、实际网络重试或刷新恢复。
- 主题设置在 `.cds2-reference[data-theme="light|dark"]`，不会修改旧 `.cr-*` 或原聊天页参数。

## 动效

`cds2-pill-pop` 的关键帧最高 `scale(1.32)`；级联逐项延迟 45ms，持续 240ms；骨架扫光为 105° 渐变、1400ms、每次触发三轮。所有动画均可在 CSS 中定位。没有“消除所有丢帧”等性能保证。系统 `prefers-reduced-motion: reduce` 时全部停止。

## 当前范围

现有聊天实例继续保留已认可的视觉基线。新版侧栏密度、环境分组、多窗口和完整工作台布局尚未接入，待截图比较后单独迭代。没有真实模型、账户、托管策略、离线队列或桌面运行时。

校验：仓库根目录运行 `python3 scripts/build-deliverables.py`、`python3 scripts/verify-package.py`。浏览器实测记录另见 `VALIDATION.md`。
