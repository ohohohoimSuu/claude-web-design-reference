#!/usr/bin/env python3
"""Generate portable HTML, the text-only Agent guide and content hashes."""
import base64
import hashlib
import html as html_module
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / 'examples/claude-chat'
CDS2 = ROOT / 'examples/cds2-components'
GUIDE = ROOT / 'Claude网页设计参考_v3_Agent.md'
TEXT_FILES = [
    'index.html', 'assets/fonts.css', 'assets/reference.css', 'assets/chat.css',
    'assets/interactions.js', 'assets/chat.js', 'assets/favicon.svg',
]
CDS2_TEXT_FILES = ['index.html','components.css','components.js','preview.css','preview.js']


def font_data(path):
    mime = 'font/woff2' if path.suffix == '.woff2' else 'font/ttf'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()


def embedded_font_css():
    css = (DEMO/'assets/fonts.css').read_text()
    return re.sub(r"url\('([^']+)'\)",lambda m:"url('" + font_data(DEMO/'assets'/m[1]) + "')",css)


def font_licenses():
    return '\n\n'.join((DEMO/'assets/fonts'/name).read_text() for name in ('OFL.txt','Afternoon-Display-OFL.txt'))


def font_study_standalone():
    html = (DEMO/'font-study.html').read_text()
    html = html.replace('<link rel="stylesheet" href="assets/fonts.css">','<style>\n' + embedded_font_css() + '\n</style>')
    html = html.replace("url('assets/fonts/newsreader-study.woff2')", "url('" + font_data(DEMO/'assets/fonts/newsreader-study.woff2') + "')")
    html = html.replace('<a href="index.html">回到聊天演示 →</a>','<span>聊天演示见同目录 standalone.html</span>')
    return html.replace('</head>','<!-- Font licenses: ' + font_licenses().replace('--','—') + '\n-->\n</head>')


def cds2_standalone():
    html = (CDS2 / 'index.html').read_text()
    font_css = embedded_font_css()
    html = html.replace('<link rel="stylesheet" href="../claude-chat/assets/fonts.css">',
                        '<style>\n' + font_css + '\n</style>')
    for name in ('components.css','preview.css'):
        html = html.replace(f'<link rel="stylesheet" href="{name}">',
                            f'<style data-source="{name}">\n{(CDS2/name).read_text()}\n</style>')
    for name, source in [('../../interaction-examples.js',ROOT/'interaction-examples.js'),
                         ('components.js',CDS2/'components.js'),('preview.js',CDS2/'preview.js')]:
        js = re.sub(r'</script', r'<\\/script', source.read_text(), flags=re.I)
        html = html.replace(f'<script src="{name}"></script>',f'<script>\n{js}\n</script>')
    html = html.replace('href="../claude-chat/"','href="#top"').replace('href="README.md"','href="#integration"')
    html = html.replace('<body class=', '<body id="top" class=')
    readme = html_module.escape((CDS2/'README.md').read_text())
    html = html.replace('</main>', '<details id="integration" style="margin-top:24px"><summary>组件接入说明</summary>' +
                        '<pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px">' + readme + '</pre></details></main>')
    return html.replace('</head>', '<!-- Font licenses: ' + font_licenses().replace('--','—') + '\n-->\n</head>')


def standalone():
    html = (DEMO / 'index.html').read_text()
    for name in ('fonts', 'reference', 'chat'):
        css = (DEMO / f'assets/{name}.css').read_text()
        if name == 'fonts':
            css = embedded_font_css()
        html = html.replace(f'<link rel="stylesheet" href="assets/{name}.css">',
                            f'<style data-source="assets/{name}.css">\n{css}\n</style>')
    for name in ('interactions', 'chat'):
        js = (DEMO / f'assets/{name}.js').read_text()
        js = re.sub(r'</script', r'<\\/script', js, flags=re.I)
        html = html.replace(f'<script src="assets/{name}.js"></script>',
                            f'<script data-source="assets/{name}.js">\n{js}\n</script>')
    favicon = base64.b64encode((DEMO / 'assets/favicon.svg').read_bytes()).decode()
    html = html.replace('href="assets/favicon.svg"', f'href="data:image/svg+xml;base64,{favicon}"')
    return html.replace('<body>', '<!-- Font licenses: ' + font_licenses().replace('--','—') + '\n-->\n<body>', 1)


def agent_guide():
    text = (ROOT / 'docs/agent-guide-intro.md').read_text().rstrip()
    text += '\n\n## 完整文本源码\n\n以下内容由可编辑实例生成。每段标题就是保存路径。字体二进制按前文处理。\n'
    for name in TEXT_FILES:
        language = {'.html':'html','.css':'css','.js':'javascript','.svg':'xml'}[Path(name).suffix]
        text += f'\n### 文件：examples/claude-chat/{name}\n\n~~~~{language}\n'
        source = (DEMO / name).read_text().rstrip()
        if name == 'assets/fonts.css':
            # Keep the custom title available even when the Agent receives only this guide.
            source = source.replace("url('fonts/afternoon-display-regular.woff2')", "url('" + font_data(DEMO/'assets/fonts/afternoon-display-regular.woff2') + "')")
        text += source + '\n~~~~\n'
    for name, path in [('共享交互 API', ROOT / 'INTERACTION_API.txt'),
                       ('Inter 字体许可', DEMO / 'assets/fonts/OFL.txt'),
                       ('Afternoon Display 字体许可', DEMO / 'assets/fonts/Afternoon-Display-OFL.txt'),
                       ('标题字体修改说明', ROOT / 'font-sources/README.md'),
                       ('上游许可', ROOT / 'UPSTREAM_LICENSE.txt')]:
        text += f'\n## {name}\n\n~~~~text\n{path.read_text().rstrip()}\n~~~~\n'
    text += '\n## 可选扩展：CDS 2.0 组件\n\n' + (CDS2/'README.md').read_text()
    text += '\n以下源文件只在主动引入时使用，不替换既有聊天页。共享交互 JS 取前文 assets/interactions.js 的同份源码保存到根目录 interaction-examples.js；字体路径复用前文 assets/fonts.css。\n'
    for name in CDS2_TEXT_FILES:
        language = {'.html':'html','.css':'css','.js':'javascript'}[Path(name).suffix]
        text += f'\n### 文件：examples/cds2-components/{name}\n\n~~~~{language}\n{(CDS2/name).read_text().rstrip()}\n~~~~\n'
    return text


def package_files():
    return sorted(p for p in ROOT.rglob('*') if p.is_file() and
                  not any(part.startswith('.') or part in ('__pycache__','node_modules')
                          for part in p.relative_to(ROOT).parts) and
                  p.name != 'MANIFEST.json')


def main():
    shutil.copyfile(ROOT / 'interaction-examples.js', DEMO / 'assets/interactions.js')
    shutil.copyfile(ROOT / 'claude-reference.css', DEMO / 'assets/reference.css')
    (DEMO / 'standalone.html').write_text(standalone())
    (CDS2 / 'standalone.html').write_text(cds2_standalone())
    (DEMO/'font-study-standalone.html').write_text(font_study_standalone())
    GUIDE.write_text(agent_guide())
    manifest = {'version':'3.2', 'default_example':'examples/claude-chat/index.html',
                'agent_entry':'AGENTS.md', 'single_file_guide':GUIDE.name,
                'upstream_commit':'f4947c62a459f6413ed44b289a8d495962add1a2',
                'cds2_extension_commit':'f504349419118a32804ce3a7fae74593070bf945',
                'files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()
                         for p in package_files()}}
    (ROOT / 'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'Generated standalone.html, {GUIDE.name}, and {len(manifest["files"])} file hashes.')


if __name__ == '__main__':
    main()
