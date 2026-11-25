"""Extract the episode verbatim from the user-provided FB2 (no network)."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ns = {'f': 'http://www.gribuser.ru/xml/fictionbook/2.0'}
root = ET.parse('ленивое мужество.fb2').getroot()
chapter = next(s for s in root.findall('.//f:body/f:section', ns)
               if s.find('f:title', ns) is not None
               and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 8')
paragraphs = [''.join(p.itertext()) for p in chapter.findall('f:p', ns)[:26]]
speakers = {0: 'mach', 1: 'mach', 3: 'sayaka', 4: 'mach', 5: 'sayaka',
            6: 'mach', 7: 'sayaka', 8: 'mach', 9: 'sayaka', 13: 'mach',
            14: 'sayaka', 15: 'mach', 22: 'mach', 23: 'clerk', 24: 'mach', 25: 'clerk'}
lines = []
for i, paragraph in enumerate(paragraphs):
    speaker = speakers.get(i, 'narrator')
    # Dialogue, including author interjections, is always one reading step.
    pages = [paragraph]
    if speaker == 'narrator' and len(paragraph) > 330:
        pages = []
        page = ''
        for sentence in re.split(r'(?<=[.!?])\s+(?=[А-ЯЁ])', paragraph):
            if page and len(page) + len(sentence) > 330:
                pages.append(page)
                page = ''
            page += (' ' if page else '') + sentence
        if page:
            pages.append(page)
    for k, page in enumerate(pages):
        lines.append({'id': f'p{i}-0-{k}', 'paragraph': i, 'speaker': speaker, 'text': page})
Path('src/book.json').write_text(json.dumps(lines, ensure_ascii=False, indent=2) + '\n')
Path('docs/chapter8-excerpt.json').write_text(json.dumps(paragraphs, ensure_ascii=False, indent=2) + '\n')
print(f'{len(paragraphs)} complete paragraphs, {len(lines)} reading pages')

prologue = next(s for s in root.findall('.//f:body/f:section', ns)
                if s.find('f:title', ns) is not None
                and ''.join(s.find('f:title', ns).itertext()).strip() == 'Пролог')
def paragraph_runs(paragraph):
    runs = [{'text': paragraph.text}] if paragraph.text else []
    for child in paragraph:
        kind = child.tag.rsplit('}', 1)[-1]
        assert kind in ('emphasis', 'strong'), child.tag
        runs.append({'text': ''.join(child.itertext()), kind: True})
        if child.tail:
            runs.append({'text': child.tail})
    return runs


paragraphs = [paragraph_runs(p) for p in prologue.findall('f:p', ns)]
Path('src/prologue.json').write_text(json.dumps(paragraphs, ensure_ascii=False, indent=2) + '\n')
print(f'Prologue: {len(paragraphs)} complete paragraphs, emphasis preserved')

# Append the rest of chapter one without renumbering the existing reading steps.
chapter_one = next(s for s in root.findall('.//f:body/f:section', ns)
                   if s.find('f:title', ns) is not None
                   and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 1')
chapter_one_paragraphs = chapter_one.findall('f:p', ns)
assert ''.join(chapter_one_paragraphs[25].itertext()).endswith('Выбирай мудро!')
chapter_one_runs = [paragraph_runs(p) for p in chapter_one_paragraphs]
Path('src/chapter-one.json').write_text(json.dumps(chapter_one_runs, ensure_ascii=False, indent=2) + '\n')
print(f'Chapter 1: {len(chapter_one_runs)} complete paragraphs, emphasis preserved')

chapter_two = next(s for s in root.findall('.//f:body/f:section', ns)
                   if s.find('f:title', ns) is not None
                   and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 2')
chapter_two_runs = [paragraph_runs(p) for p in chapter_two.findall('f:p', ns)]
Path('src/chapter-two.json').write_text(json.dumps(chapter_two_runs, ensure_ascii=False, indent=2) + '\n')
print(f'Chapter 2: {len(chapter_two_runs)} complete paragraphs, emphasis preserved')

chapter_three = next(s for s in root.findall('.//f:body/f:section', ns)
                     if s.find('f:title', ns) is not None
                     and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 3')
chapter_three_runs = [paragraph_runs(p) for p in chapter_three.findall('f:p', ns)]
Path('src/chapter-three.json').write_text(json.dumps(chapter_three_runs, ensure_ascii=False, indent=2) + '\n')
print(f'Chapter 3: {len(chapter_three_runs)} complete paragraphs, emphasis preserved')

chapter_four = next(s for s in root.findall('.//f:body/f:section', ns)
                    if s.find('f:title', ns) is not None
                    and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 4')
chapter_four_runs = [paragraph_runs(p) for p in chapter_four.findall('f:p', ns)]
Path('src/chapter-four.json').write_text(json.dumps(chapter_four_runs, ensure_ascii=False, indent=2) + '\n')
print(f'Chapter 4: {len(chapter_four_runs)} complete paragraphs, emphasis preserved')

chapter_five = next(s for s in root.findall('.//f:body/f:section', ns)
                    if s.find('f:title', ns) is not None
                    and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 5')
chapter_five_runs = [paragraph_runs(p) for p in chapter_five.findall('f:p', ns)]
Path('src/chapter-five.json').write_text(json.dumps(chapter_five_runs, ensure_ascii=False, indent=2) + '\n')
print(f'Chapter 5: {len(chapter_five_runs)} complete paragraphs, emphasis preserved')
