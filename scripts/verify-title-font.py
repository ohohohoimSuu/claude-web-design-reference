#!/usr/bin/env python3
"""Optional font-engineering QA; requires fonttools[woff], like the font builder."""
from pathlib import Path
import hashlib,json
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
FONTS=ROOT/'examples/claude-chat/assets/fonts'
ttf=TTFont(FONTS/'afternoon-display-regular.ttf')
woff=TTFont(FONTS/'afternoon-display-regular.woff2')
baseline=TTFont(FONTS/'newsreader-study.woff2')
report=json.loads((ROOT/'font-sources/BUILD.json').read_text())
assert ttf['name'].getDebugName(1)=='Afternoon Display'
assert ttf['name'].getDebugName(6)=='AfternoonDisplay-Regular'
assert ttf.getBestCmap()==woff.getBestCmap()
assert all(code in ttf.getBestCmap() for code in range(32,127))
assert 'fvar' not in ttf and ttf['OS/2'].usWeightClass==400
for code in range(33,127):
    glyph_name=ttf.getBestCmap()[code]
    glyph=ttf['glyf'][glyph_name]
    assert glyph.numberOfContours>0, chr(code)
    assert ttf['hmtx'][glyph_name][0]>0,chr(code)
    assert glyph.yMin>=-ttf['OS/2'].usWinDescent and glyph.yMax<=ttf['OS/2'].usWinAscent,chr(code)
for name in ttf.getGlyphOrder():
    assert ttf['hmtx'][name]==woff['hmtx'][name],name
    assert ttf['glyf'][name].getCoordinates(ttf['glyf'])[0]==woff['glyf'][name].getCoordinates(woff['glyf'])[0],name
for char in 'ergonu':
    name=ttf.getBestCmap()[ord(char)]
    assert ttf['glyf'][name].getCoordinates(ttf['glyf'])[0]!=baseline['glyf'][name].getCoordinates(baseline['glyf'])[0],char
for name,metadata in report['outputs'].items():
    assert hashlib.sha256((FONTS/name).read_bytes()).hexdigest()==metadata['sha256'],name
assert hashlib.sha256((ROOT/'font-sources/newsreader.ttf').read_bytes()).hexdigest()==report['source_sha256']
print('PASS: renamed static font, printable ASCII, nonempty outlines, clipping bounds, modified glyphs, TTF/WOFF2 geometry parity, source/output hashes.')
