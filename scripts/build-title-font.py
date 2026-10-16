#!/usr/bin/env python3
"""Build a renamed OFL display-font derivative from the pinned Newsreader source.

Requires fonttools[woff]. Run from any directory. All geometry and spacing
changes are actual OpenType data; CSS transform/letter-spacing is not required.
"""
import hashlib
import json
from pathlib import Path
import shutil
import unicodedata

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.otlLib.builder import buildPairPosGlyphs
from fontTools.ttLib.tables import otTables
from fontTools.ttLib.tables.otBase import ValueRecord
from fontTools import subset
from fontTools.misc.roundTools import otRound

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'font-sources'
OUT = ROOT/'examples/claude-chat/assets/fonts'
CONFIG = json.loads((SOURCE/'afternoon-display.json').read_text())


def rename(font, family, ps_name, description=None):
    replacements = {1: family, 2:'Regular', 3:'0.100;OCUI;' + ps_name,
                    4:family + ' Regular', 5:'Version 0.100', 6:ps_name,
                    16:family, 17:'Regular', 21:family, 22:'Regular',
                    10:description or 'OFL derivative of Newsreader 1.003. Display prototype with altered outlines and spacing.'}
    for record in list(font['name'].names):
        if record.nameID in replacements or record.nameID == 25:
            font['name'].names.remove(record)
    for name_id, text in replacements.items():
        font['name'].setName(text,name_id,3,1,0x409)
    font['head'].fontRevision = 0.1
    font['OS/2'].usWeightClass = 400
    font['OS/2'].fsSelection = (font['OS/2'].fsSelection & ~33) | 64
    font['head'].macStyle = 0


def compact(font):
    options = subset.Options()
    options.hinting = False
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    options.recalc_bounds = True
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=list(range(0x20,0x250)) + list(range(0x2000,0x2070)) + [0x20ac])
    sub.subset(font)


def scale_pair_values(font, scale):
    # Newsreader's pair-position tables contain both class and explicit pairs.
    for lookup in font['GPOS'].table.LookupList.Lookup:
        for subtable in lookup.SubTable:
            st = subtable.ExtSubTable if lookup.LookupType == 9 else subtable
            if (subtable.ExtensionLookupType if lookup.LookupType == 9 else lookup.LookupType) != 2:
                continue
            rows = []
            if st.Format == 1:
                rows = [r for s in st.PairSet for r in s.PairValueRecord]
            elif st.Format == 2:
                rows = [r for s in st.Class1Record for r in s.Class2Record]
            for row in rows:
                for attr in ('Value1','Value2'):
                    value = getattr(row,attr,None)
                    if value:
                        for name in ('XPlacement','XAdvance'):
                            if hasattr(value,name):setattr(value,name,otRound(getattr(value,name)*scale))


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    source_bytes = (SOURCE/CONFIG['source']).read_bytes()
    font = TTFont(SOURCE/CONFIG['source'],recalcTimestamp=False)
    font = instantiateVariableFont(font,CONFIG['axes'],inplace=True)
    compact(font)
    # The comparison baseline is the same optical-size/weight instance, before edits.
    baseline = TTFont(SOURCE/CONFIG['source'],recalcTimestamp=False)
    baseline = instantiateVariableFont(baseline,CONFIG['axes'],inplace=True)
    compact(baseline)
    rename(baseline,'Newsreader Study','NewsreaderStudy-Regular',
           'Newsreader 1.003 static instance at weight 400, optical size 40. Unmodified outlines; renamed for comparison.')
    baseline.flavor='woff2'
    baseline.save(OUT/'newsreader-study.woff2')

    glyphset = font.getGlyphSet()
    cmap = font.getBestCmap()
    # Decompose first, before changing any base glyph, so accents are transformed once.
    decomposed = {}
    for name in font.getGlyphOrder():
        recording = DecomposingRecordingPen(glyphset)
        glyphset[name].draw(recording)
        pen = TTGlyphPen(None)
        recording.replay(pen)
        decomposed[name] = pen.glyph()
    letter_for_glyph = {}
    for codepoint,name in cmap.items():
        letter_for_glyph.setdefault(name,unicodedata.normalize('NFD',chr(codepoint))[0])
    width_scale = CONFIG['width_scale']
    changes = {}
    for name,glyph in decomposed.items():
        char = letter_for_glyph.get(name,'')
        xscale = width_scale * CONFIG['glyph_width_multipliers'].get(char,1)
        advance,lsb = font['hmtx'][name]
        if glyph.numberOfContours > 0:
            coordinates,ends,flags = glyph.getCoordinates(font['glyf'])
            modified = []
            for x,y in coordinates:
                if y < 0: y *= CONFIG['descender_scale']
                elif y <= CONFIG['shoulder_y']: y *= CONFIG['lowercase_height_scale']
                else: y = CONFIG['shoulder_y']*CONFIG['lowercase_height_scale'] + (y-CONFIG['shoulder_y'])*CONFIG['upper_height_scale']
                modified.append((otRound(x*xscale),otRound(y)))
            glyph.coordinates = GlyphCoordinates(modified)
            glyph.recalcBounds(font['glyf'])
            new_lsb = glyph.xMin
        else:
            new_lsb = otRound(lsb*xscale)
        font['glyf'][name] = glyph
        new_advance = otRound(advance*xscale + CONFIG['advance_additions'].get(char,0) + (CONFIG['advance_tracking'] if advance else 0))
        if char in (' ','\u00a0'):new_advance=CONFIG['word_space_units']
        font['hmtx'][name] = (new_advance,new_lsb)
        if char in CONFIG['glyph_width_multipliers'] and name == cmap.get(ord(char)):
            changes[char] = {'x_scale':xscale,'advance_before':advance,'advance_after':new_advance}
    scale_pair_values(font,width_scale)
    pairs = {}
    for pair,amount in CONFIG['pair_adjustments'].items():
        value = ValueRecord()
        value.XAdvance = amount
        pairs[(cmap[ord(pair[0])],cmap[ord(pair[1])])] = (value,None)
    lookup = otTables.Lookup()
    lookup.LookupType=2; lookup.LookupFlag=0
    lookup.SubTable=buildPairPosGlyphs(pairs,font.getReverseGlyphMap())
    lookup.SubTableCount=len(lookup.SubTable)
    index=len(font['GPOS'].table.LookupList.Lookup)
    font['GPOS'].table.LookupList.Lookup.append(lookup)
    font['GPOS'].table.LookupList.LookupCount=index+1
    for feature in font['GPOS'].table.FeatureList.FeatureRecord:
        if feature.FeatureTag=='kern':
            feature.Feature.LookupListIndex.append(index)
            feature.Feature.LookupCount=len(feature.Feature.LookupListIndex)
    # Geometry changed: original TrueType hint programs no longer apply.
    for table in ('fpgm','prep','cvt ','hdmx','LTSH','VDMX','DSIG'):
        if table in font:del font[table]
    font['OS/2'].sxHeight = otRound(font['OS/2'].sxHeight*CONFIG['lowercase_height_scale'])
    font['OS/2'].sCapHeight = font['glyf'][cmap[ord('H')]].yMax
    rename(font,CONFIG['family'],'AfternoonDisplay-Regular')
    font.save(OUT/'afternoon-display-regular.ttf')
    font.flavor='woff2'
    font.save(OUT/'afternoon-display-regular.woff2')
    shutil.copyfile(SOURCE/'Newsreader-OFL.txt',OUT/'Afternoon-Display-OFL.txt')
    report = {'family':CONFIG['family'],'version':CONFIG['version'],
              'source_sha256':hashlib.sha256(source_bytes).hexdigest(),
              'source_version':'Newsreader 1.003','axes':CONFIG['axes'],
              'glyph_count':len(font.getGlyphOrder()),'encoded_characters':len(font.getBestCmap()),
              'ascii_printable_coverage':all(c in font.getBestCmap() for c in range(32,127)),
              'modified_glyph_metrics':changes,'pair_adjustments':CONFIG['pair_adjustments'],
              'outputs':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
                         for p in [OUT/'afternoon-display-regular.ttf',OUT/'afternoon-display-regular.woff2',OUT/'newsreader-study.woff2']}}
    (SOURCE/'BUILD.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
