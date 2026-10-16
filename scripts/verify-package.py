#!/usr/bin/env python3
"""Check distribution integrity and reuse contracts, without external packages."""
import base64
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_deliverables', ROOT/'scripts/build-deliverables.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)
DEMO = build.DEMO


def check(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)


def local_reference(path, reference):
    ref = urlsplit(reference)
    if ref.scheme or ref.netloc or not ref.path:
        return
    check((path.parent / unquote(ref.path)).exists(), f'{path.name}: missing {reference}')


def main():
    for path in [ROOT/'README.md', ROOT/'AGENTS.md', DEMO/'README.md',build.CDS2/'README.md']:
        text = path.read_text()
        for ref in re.findall(r'\]\(([^)]+)\)|(?:src|href)="([^"]+)"', text):
            local_reference(path, ref[0] or ref[1])
    index = DEMO/'index.html'
    for ref in re.findall(r'(?:src|href)="([^"]+)"', index.read_text()):
        local_reference(index, ref)
    for ref in re.findall(r'(?:src|href)="([^"]+)"', (build.CDS2/'index.html').read_text()):
        local_reference(build.CDS2/'index.html', ref)
    cds2_portable = (build.CDS2/'standalone.html').read_text()
    check(cds2_portable == build.cds2_standalone(), 'CDS 2.0 standalone is stale')
    check(not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"', cds2_portable),
          'CDS 2.0 standalone has external script/style dependencies')
    check(len(re.findall('data:font/(?:ttf|woff2);base64,', cds2_portable)) == 4, 'CDS 2.0 fonts not embedded')
    check((DEMO/'font-study-standalone.html').read_text() == build.font_study_standalone(), 'font study is stale')
    fonts = DEMO/'assets/fonts.css'
    for ref in re.findall(r"url\('([^']+)'\)", fonts.read_text()):
        local_reference(fonts, ref)
    for root_file, copy_file in [('interaction-examples.js','assets/interactions.js'),
                                 ('claude-reference.css','assets/reference.css')]:
        check((ROOT/root_file).read_bytes() == (DEMO/copy_file).read_bytes(), f'{copy_file} is stale')
    portable = (DEMO/'standalone.html').read_text()
    check(portable == build.standalone(), 'standalone.html is stale; run build-deliverables.py')
    check(build.GUIDE.read_text() == build.agent_guide(), 'v3 Agent guide is stale')
    check(not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"', portable),
          'portable HTML still needs a script or stylesheet file')
    embedded = re.findall(r'data:font/ttf;base64,([^\x27]+)', portable)
    check(len(embedded) == 3, 'portable HTML must embed all three font weights')
    for encoded, weight in zip(embedded, (400,500,600)):
        check(base64.b64decode(encoded) == (DEMO/f'assets/fonts/inter-{weight}.ttf').read_bytes(),
              f'embedded font {weight} mismatch')
    title_font = (DEMO/'assets/fonts/afternoon-display-regular.woff2').read_bytes()
    check(title_font.startswith(b'wOF2'), 'title font is not WOFF2')
    title_embeds = re.findall(r"data:font/woff2;base64,([^\x27]+)",portable)
    check(len(title_embeds) == 1 and base64.b64decode(title_embeds[0]) == title_font,'embedded title font mismatch')
    guide_title = re.findall(r"data:font/woff2;base64,([^\x27]+)",build.GUIDE.read_text())
    check(len(guide_title) == 1 and base64.b64decode(guide_title[0]) == title_font,'Agent guide must embed the actual title font')
    check('The Newsreader Project Authors' in portable,'title font license missing')
    check('SIL OPEN FONT LICENSE' in portable, 'portable font license is missing')
    for screenshot in ('home','dark','mobile'):
        check((ROOT/f'assets/readme-chat-{screenshot}.jpg').read_bytes().startswith(b'\xff\xd8'),
              f'{screenshot} preview is not JPEG')
    profile = json.loads((ROOT/'chat-profile.json').read_text())
    css = (DEMO/'assets/chat.css').read_text()
    for theme, selector in [('light',':root'),('dark','[data-theme=dark]')]:
        block = re.search(re.escape(selector)+r'\{([^}]+)\}',css).group(1)
        values = dict(re.findall(r'--([a-z-]+):([^;]+)',block))
        check(profile['themes'][theme] == values, f'{theme} profile differs from actual CSS')
    manifest = json.loads((ROOT/'MANIFEST.json').read_text())
    actual = {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()
              for p in build.package_files()}
    check(manifest['files'] == actual, 'file hashes changed; run build-deliverables.py')
    for name in actual:
        if Path(name).suffix in ('.md','.txt','.js','.html','.json','.css'):
            text = (ROOT/name).read_text()
            check('claimToken=' not in text and '/Users/suu/' not in text,
                  f'private deployment/local-machine data in {name}')
    for path in [ROOT/'interaction-examples.js',DEMO/'assets/chat.js',DEMO/'assets/interactions.js',
                 build.CDS2/'components.js',build.CDS2/'preview.js']:
        subprocess.run(['node','--check',str(path)],check=True)
    subprocess.run(['node','interaction-tests.cjs'],cwd=ROOT,check=True)
    subprocess.run(['node','examples/cds2-components/components-tests.cjs'],cwd=ROOT,check=True)
    print(f'PASS: links, assets, fonts, generated distributions, {len(actual)} hashes, JS syntax and shared interaction tests.')


if __name__ == '__main__':
    main()
