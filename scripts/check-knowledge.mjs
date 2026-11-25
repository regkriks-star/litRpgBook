#!/usr/bin/env node
// Validates the living knowledge base: required files, dates, links, anchors,
// stable IDs and status values. No external dependencies.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const knowledge = resolve(root, 'docs/knowledge');
const required = [
  'README.md',
  'architecture.md',
  'invariants.md',
  'workflows.md',
  'verification.md',
  'decisions.md',
  'known-issues.md',
  'glossary.md',
  'changelog.md',
];
const errors = [];
const notes = [];
const fail = (message) => errors.push(message);

function read(path) {
  return readFileSync(path, 'utf8');
}

function slug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/ /g, '-');
}

function headings(text) {
  const seen = new Map();
  const result = new Set();
  for (const line of text.split('\n')) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = slug(match[1]);
    if (!base) continue;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    result.add(count ? `${base}-${count}` : base);
  }
  return result;
}

for (const file of required) {
  if (!existsSync(resolve(knowledge, file))) fail(`нет обязательного файла docs/knowledge/${file}`);
}
const present = existsSync(knowledge)
  ? readdirSync(knowledge).filter(file => file.endsWith('.md')).sort()
  : [];
for (const file of present) {
  const text = read(resolve(knowledge, file));
  if (!/^Обновлено: \d{4}-\d{2}-\d{2}\./m.test(text)) fail(`${file}: нет строки «Обновлено: YYYY-MM-DD.»`);
  if (!/^#\s+/m.test(text)) fail(`${file}: нет заголовка H1`);
  if (text.trim().length < 200) fail(`${file}: подозрительно пустой`);
}

// README must route to every other document.
if (existsSync(resolve(knowledge, 'README.md'))) {
  const readme = read(resolve(knowledge, 'README.md'));
  for (const file of present.filter(file => file !== 'README.md')) {
    if (!readme.includes(`(${file})`)) fail(`README.md: нет ссылки на ${file}`);
  }
}

// Links and anchors.
const markdownFiles = present.map(file => resolve(knowledge, file));
for (const path of markdownFiles) {
  const text = read(path);
  const withoutFences = text.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutFences.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    const [rawPath, rawAnchor] = target.split('#');
    const targetPath = rawPath ? resolve(dirname(path), rawPath) : path;
    if (!existsSync(targetPath)) {
      fail(`${path.slice(root.length + 1)}: битая ссылка ${target}`);
      continue;
    }
    if (!rawAnchor || !targetPath.endsWith('.md')) continue;
    if (/^L\d+(?:-L\d+)?$/.test(rawAnchor)) continue;
    const anchors = headings(read(targetPath));
    if (!anchors.has(rawAnchor)) fail(`${path.slice(root.length + 1)}: нет якоря #${rawAnchor} в ${targetPath.slice(root.length + 1)}`);
  }
}

// Stable IDs and status values in the issue registry.
const issuesPath = resolve(knowledge, 'known-issues.md');
if (existsSync(issuesPath)) {
  const text = read(issuesPath);
  const allowed = new Set(['open', 'in-progress', 'fixed', 'wontfix', 'superseded']);
  const ids = [...text.matchAll(/^##\s+(KI-\d{3})\b/gm)].map(match => match[1]);
  const unique = new Set(ids);
  if (ids.length !== unique.size) fail('known-issues.md: повторяются ID KI');
  for (const line of text.split('\n')) {
    if (!/^\|\s*\[KI-\d{3}\]/.test(line)) continue;
    const cells = line.split('|').map(cell => cell.trim());
    const id = cells[1]?.match(/KI-\d{3}/)?.[0];
    const status = cells[3];
    if (!id || !status) fail(`known-issues.md: не разобрана строка ${line.slice(0, 80)}`);
    else if (!allowed.has(status)) fail(`known-issues.md: недопустимый статус ${status} у ${id}`);
    if (id && !unique.has(id)) fail(`known-issues.md: в таблице есть ${id}, но нет раздела`);
  }
  for (const match of text.matchAll(/\*\*Статус\.\*\*\s*([a-z-]+)/g)) {
    if (!allowed.has(match[1])) fail(`known-issues.md: недопустимый статус ${match[1]}`);
  }
  const tableIds = new Set([...text.matchAll(/^\|\s*\[(KI-\d{3})\]/gm)].map(match => match[1]));
  for (const id of unique) if (!tableIds.has(id)) fail(`known-issues.md: ${id} нет в сводной таблице`);
  notes.push(`известных проблем: ${unique.size}`);
}

// Decision IDs.
const decisionsPath = resolve(knowledge, 'decisions.md');
if (existsSync(decisionsPath)) {
  const text = read(decisionsPath);
  const ids = [...text.matchAll(/^##\s+(D-\d{3})\b/gm)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) fail('decisions.md: повторяются ID D');
  notes.push(`решений: ${ids.length}`);
}

// Invariants and workflows IDs.
for (const [file, prefix] of [['invariants.md', 'INV'], ['workflows.md', 'WF']]) {
  const path = resolve(knowledge, file);
  if (!existsSync(path)) continue;
  const ids = [...read(path).matchAll(new RegExp(`^##\\s+(${prefix}-\\d{2})\\b`, 'gm'))].map(match => match[1]);
  if (new Set(ids).size !== ids.length) fail(`${file}: повторяются ID ${prefix}`);
  notes.push(`${prefix}: ${ids.length}`);
}

// Changelog must have at least one dated entry.
const changelogPath = resolve(knowledge, 'changelog.md');
if (existsSync(changelogPath) && !/^##\s+\d{4}-\d{2}-\d{2}\s+·/m.test(read(changelogPath))) {
  fail('changelog.md: нет ни одной записи «## YYYY-MM-DD · …»');
}

if (errors.length) {
  console.error(`Проверка базы знаний: ${errors.length} ошибок`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`База знаний в порядке: ${present.length} файлов, ${notes.join(', ')}.`);
