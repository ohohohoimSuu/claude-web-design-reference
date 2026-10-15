#!/usr/bin/env python3
"""Generate portable HTML, the text-only Agent guide and content hashes."""
import base64
import hashlib
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / 'examples/claude-chat'
GUIDE = ROOT / 'Claude网页设计参考_v3_Agent.md'
TEXT_FILES = [
    'index.html', 'assets/fonts.css', 'assets/reference.css', 'assets/chat.css',
    'assets/interactions.js', 'assets/chat.js', 'assets/favicon.svg',
]


def standalone():
    html = (DEMO / 'index.html').read_text()
    for name in ('fonts', 'reference', 'chat'):
        css = (DEMO / f'assets/{name}.css').read_text()
        if name == 'fonts':
            css = re.sub(r"url\('([^']+)'\)", lambda m: "url('data:font/ttf;base64," +
                         base64.b64encode((DEMO / 'assets' / m[1]).read_bytes()).decode() + "')", css)
        html = html.replace(f'<link rel="stylesheet" href="assets/{name}.css">',
                            f'<style data-source="assets/{name}.css">\n{css}\n</style>')
    for name in ('interactions', 'chat'):
        js = (DEMO / f'assets/{name}.js').read_text()
        js = re.sub(r'</script', r'<\\/script', js, flags=re.I)
        html = html.replace(f'<script src="assets/{name}.js"></script>',
                            f'<script data-source="assets/{name}.js">\n{js}\n</script>')
    favicon = base64.b64encode((DEMO / 'assets/favicon.svg').read_bytes()).decode()
    html = html.replace('href="assets/favicon.svg"', f'href="data:image/svg+xml;base64,{favicon}"')
    license_text = (DEMO / 'assets/fonts/OFL.txt').read_text().replace('--', '—')
    return html.replace('<body>', '<!-- Inter license: ' + license_text + '\n-->\n<body>', 1)


def agent_guide():
    text = (ROOT / 'docs/agent-guide-intro.md').read_text().rstrip()
    text += '\n\n## 完整文本源码\n\n以下内容由可编辑实例生成。每段标题就是保存路径。字体二进制按前文处理。\n'
    for name in TEXT_FILES:
        language = {'.html':'html','.css':'css','.js':'javascript','.svg':'xml'}[Path(name).suffix]
        text += f'\n### 文件：examples/claude-chat/{name}\n\n~~~~{language}\n'
        text += (DEMO / name).read_text().rstrip() + '\n~~~~\n'
    for name, path in [('共享交互 API', ROOT / 'INTERACTION_API.txt'),
                       ('Inter 字体许可', DEMO / 'assets/fonts/OFL.txt'),
                       ('上游许可', ROOT / 'UPSTREAM_LICENSE.txt')]:
        text += f'\n## {name}\n\n~~~~text\n{path.read_text().rstrip()}\n~~~~\n'
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
    GUIDE.write_text(agent_guide())
    manifest = {'version':'3.0', 'default_example':'examples/claude-chat/index.html',
                'agent_entry':'AGENTS.md', 'single_file_guide':GUIDE.name,
                'upstream_commit':'f4947c62a459f6413ed44b289a8d495962add1a2',
                'files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()
                         for p in package_files()}}
    (ROOT / 'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'Generated standalone.html, {GUIDE.name}, and {len(manifest["files"])} file hashes.')


if __name__ == '__main__':
    main()
