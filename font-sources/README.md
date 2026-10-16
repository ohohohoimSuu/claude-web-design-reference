# Afternoon Display 0.1

一款为英文欢迎标题制作的常规字重实验字体，以 Newsreader 1.003 的 `wght=400 / opsz=40` 实例为底稿。它是经过修改并重新命名的 OFL 衍生字体，不是 Claude 原版字体，也没有使用 Anthropic 字体轮廓。

## 本版修改

- 调整实际字形坐标：整体宽度增加 4%；小写主体高度增加 3.5%，上伸部分压缩补偿，下伸部分缩短 10%。
- 在全局变换之外，分别调整 `e / o / g / u / n / r` 的宽度；带重音的相应字母采用同样规则。
- 调整字体内部 advance、词间空格及 `Af / ft / rn / oo / gu` 字偶间距，保留基础字体其他定位与字形替换表。
- 去掉修改后不再适用的原始 TrueType hinting；输出真实 TTF 与 WOFF2，不依赖 CSS 缩放。
- 保留 398 个编码字符、453 个字形，覆盖基础英文大小写、数字、常用标点及部分扩展拉丁字符；没有中文字形，只有一个常规样式。

截图只提供有限字样，本版针对标题的比例与观感进行设计；未出现的字符沿用同组规则调整。不是完整专业字族，不承诺与参考逐像素一致。优先在 28–64 CSS px 的标题中使用；小字号正文继续使用 Inter。

## 文件与重建

`afternoon-display.json` 是修改参数，`BUILD.json` 记录输入摘要、输出摘要和覆盖情况。`newsreader.ttf` 是开源底稿，`Newsreader-OFL.txt` 是原许可证。

```sh
python3 -m venv .font-venv
.font-venv/bin/pip install 'fonttools[woff]'
.font-venv/bin/python scripts/build-title-font.py
python3 scripts/build-deliverables.py
python3 scripts/verify-package.py
```

输出在 `examples/claude-chat/assets/fonts/`：

- `afternoon-display-regular.woff2`：网页使用，约 34 KB。
- `afternoon-display-regular.ttf`：桌面字体文件和字形检查使用。
- `newsreader-study.woff2`：未进行轮廓/间距修改的同轴实例，用于对照；仅为消除本机字体名称冲突而命名为 Newsreader Study。
- `Afternoon-Display-OFL.txt`：原版权与 SIL OFL 1.1 许可。

源地址：<https://github.com/google/fonts/blob/main/ofl/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf>。

## 接入

```css
@font-face {
  font-family: 'Afternoon Display';
  src: url('afternoon-display-regular.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
.welcome-title {
  font-family: 'Afternoon Display', Georgia, serif;
  font-weight: 400;
  font-synthesis: none;
  font-kerning: normal;
}
```

分发字体时保留版权、OFL 许可及本修改说明。此修改版沿用 SIL OFL 1.1；本项目其余代码的许可不替代字体许可。
