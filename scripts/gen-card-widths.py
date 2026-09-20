# -*- coding: utf-8 -*-
"""
gen-card-widths.py — карта РЕАЛЬНОЙ ширины опубликованных карточек.

Зачем. srcSet в atoms.tsx объявлял `480w / 960w / 1200w` для всех работ подряд,
а дескриптор — это ширина файла в пикселях. У вертикальной работы файл ограничен
по ДЛИННОЙ стороне, поэтому ширина у него, например, 914 px, а не 1200; у миниатюр,
собранных с фото сервировки, — и вовсе 380–700 px. Браузер верит дескриптору и на
узком экране тянет файл крупнее нужного (а иногда и мельче, чем обещано).

Скрипт измеряет файлы в public/assets/cards, выбрасывает копии одинаковой ширины
(у части работ @960 был побайтовым дублем оригинала) и пишет src/common/card-widths.ts.

    python scripts/gen-card-widths.py            # показать
    python scripts/gen-card-widths.py --apply    # записать .ts и удалить дубли
"""
import glob
import io
import os
import re
import sys

from PIL import Image

DIR = 'public/assets/cards'
OUT = 'src/common/card-widths.ts'
SUFFIXES = ['@480', '@960', '']          # от мелкого к крупному

apply = '--apply' in sys.argv

by_slug = {}
for f in sorted(glob.glob(os.path.join(DIR, '*.webp'))):
    m = re.match(r'^([a-z]{2}-\d{2})(@\d+)?\.webp$', os.path.basename(f))
    if not m:
        continue
    by_slug.setdefault(m.group(1), {})[m.group(2) or ''] = f

rows, dropped = {}, []
for slug, files in sorted(by_slug.items()):
    seen, keep = set(), []
    for suf in SUFFIXES:
        path = files.get(suf)
        if not path:
            continue
        w = Image.open(path).size[0]
        if w in seen:                     # та же ширина, что у уже взятого файла
            dropped.append(path)
            continue
        seen.add(w)
        keep.append((suf, w))
    rows[slug.upper()] = keep

wide = sum(1 for k in rows.values() if len(k) > 1)
print('карточек: %d (из них с реальной лесенкой: %d)' % (len(rows), wide))
print('лишних файлов одинаковой ширины: %d' % len(dropped))
for slug, keep in list(rows.items())[:4]:
    print('  %s: %s' % (slug, ' '.join('%s=%dw' % (s or 'full', w) for s, w in keep)))

if not apply:
    print('\n--apply — записать %s и удалить дубли' % OUT)
    sys.exit(0)

body = '\n'.join(
    "  '%s': [%s]," % (slug, ', '.join("['%s', %d]" % (s, w) for s, w in keep))
    for slug, keep in rows.items()
)
io.open(OUT, 'w', encoding='utf-8').write(
    '// ─────────────────────────────────────────────────────────────\n'
    '// card-widths.ts — СГЕНЕРИРОВАНО scripts/gen-card-widths.py, руками не править.\n'
    '//\n'
    '// Реальная ширина каждого опубликованного файла карточки. Нужна, чтобы srcSet\n'
    '// объявлял правду: файл ограничен по длинной стороне, поэтому у вертикальной\n'
    '// работы ширина 900–950 px, а не 1200, а у миниатюр — 380–700 px.\n'
    '// Дубли одинаковой ширины сюда не попадают (у части работ @960 был копией оригинала).\n'
    '// ─────────────────────────────────────────────────────────────\n\n'
    '/** id работы → [суффикс файла, ширина в px] от мелкого к крупному. */\n'
    'export const CARD_WIDTHS: Record<string, Array<[string, number]>> = {\n'
    + body + '\n};\n'
)
print('✓ %s' % OUT)

for path in dropped:
    os.remove(path)
print('✓ удалено дублей: %d' % len(dropped))
