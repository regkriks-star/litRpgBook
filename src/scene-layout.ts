export type SceneChapterId = 1 | 2 | 3 | 4 | 5;
export type SceneViewport = 'desktop' | 'mobile';
export type SceneTransform = { x: number; y: number; scale: number; flipX: boolean; flipY: boolean };
export type SceneElement = { desktop: SceneTransform; mobile?: SceneTransform; deleted: boolean; locked: boolean };
export type SceneClone = { id: string; source: string };
export type SceneVariant = { elements: Record<string, SceneElement | null>; clones: SceneClone[] };
export type SceneFrame = { paragraph: number; comment: string; variants: Record<string, SceneVariant> };
export type SceneChapter = { version: 1; chapter: SceneChapterId; defaults: SceneElement; frames: SceneFrame[] };
export const chapterLengths = { 1: 113, 2: 98, 3: 97, 4: 108, 5: 94 } as const;
export const defaultTransform: SceneTransform = { x: 0, y: 0, scale: 1, flipX: false, flipY: false };
export const defaultElement: SceneElement = { desktop: defaultTransform, deleted: false, locked: false };
export const sceneStorageKey = (chapter: SceneChapterId) => 'lazy-courage:scene-layout:' + chapter + ':v1';
export const sceneFileName = (chapter: SceneChapterId) => 'chapter-0' + chapter + '.json';
export function createSceneChapter(chapter: SceneChapterId): SceneChapter {
  return { version: 1, chapter, defaults: structuredClone(defaultElement), frames: Array.from({ length: chapterLengths[chapter] }, (_, paragraph) => ({ paragraph, comment: '', variants: { start: { elements: {}, clones: [] } } })) };
}
export function variantAt(doc: SceneChapter, frame: number, variant: string): SceneVariant {
  return doc.frames[frame]?.variants[variant] ?? { elements: {}, clones: [] };
}
export function clonesAt(doc: SceneChapter, frame: number, variant: string): SceneClone[] {
  const base = variantAt(doc, frame, 'start').clones;
  return variant === 'start' ? base : [...base, ...variantAt(doc, frame, variant).clones.filter(clone => !base.some(original => original.id === clone.id))];
}
export function elementAt(doc: SceneChapter, frame: number, variant: string, id: string): SceneElement {
  return variantAt(doc, frame, variant).elements[id] ?? variantAt(doc, frame, 'start').elements[id] ?? doc.defaults;
}
export const transformAt = (element: SceneElement, viewport: SceneViewport): SceneTransform => viewport === 'mobile' ? element.mobile ?? element.desktop : element.desktop;
export function changeElement(doc: SceneChapter, frame: number, variant: string, id: string, update: (element: SceneElement) => SceneElement): SceneChapter {
  const current = doc.frames[frame];
  const layer = variantAt(doc, frame, variant);
  const frames = [...doc.frames];
  frames[frame] = { ...current, variants: { ...current.variants, [variant]: { elements: { ...layer.elements, [id]: update(structuredClone(elementAt(doc, frame, variant, id))) }, clones: [...layer.clones] } } };
  return { ...doc, frames };
}
export function changeTransform(doc: SceneChapter, frame: number, variant: string, id: string, viewport: SceneViewport, patch: Partial<SceneTransform>): SceneChapter {
  return changeElement(doc, frame, variant, id, element => {
    const transform = { ...transformAt(element, viewport), ...patch };
    transform.x = Math.max(-500, Math.min(500, transform.x));
    transform.y = Math.max(-500, Math.min(500, transform.y));
    transform.scale = Math.max(0.05, Math.min(20, transform.scale));
    return { ...element, [viewport]: transform };
  });
}
export function cloneElementInFrame(doc: SceneChapter, frame: number, variant: string, source: string, viewport: SceneViewport, copied = { document: doc, variant }): { doc: SceneChapter; id: string } {
  const id = 'copy-' + crypto.randomUUID();
  const next = changeElement(doc, frame, variant, id, () => {
    const element = structuredClone(elementAt(copied.document, frame, copied.variant, source));
    return { ...element, deleted: false, locked: false, [viewport]: { ...transformAt(element, viewport), x: Math.min(500, transformAt(element, viewport).x + 3), y: Math.min(500, transformAt(element, viewport).y + 3) } };
  });
  const layer = next.frames[frame].variants[variant];
  const existingClones = clonesAt(copied.document, frame, copied.variant);
  const sourceClone = existingClones.find(clone => clone.id === source);
  layer.clones.push({ id, source: sourceClone?.source ?? source });
  const prefixes = [[source, id]];
  for (let index = 0; index < prefixes.length; index++) {
    const [original, copy] = prefixes[index];
    for (const clone of existingClones.filter(clone => clone.source.startsWith(original + '/'))) {
      const nestedId = 'copy-' + crypto.randomUUID();
      layer.clones.push({ id: nestedId, source: copy + clone.source.slice(original.length) });
      layer.elements[nestedId] = structuredClone(elementAt(copied.document, frame, copied.variant, clone.id));
      prefixes.push([clone.id, nestedId]);
    }
    const elements = { ...variantAt(copied.document, frame, 'start').elements, ...variantAt(copied.document, frame, copied.variant).elements };
    for (const [childId, element] of Object.entries(elements)) if (childId.startsWith(original + '/')) layer.elements[copy + childId.slice(original.length)] = structuredClone(element);
  }
  return { doc: next, id };
}
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function validTransform(value: unknown): value is SceneTransform {
  if (!record(value)) return false;
  return ['x', 'y', 'scale'].every(key => typeof value[key] === 'number' && Number.isFinite(value[key]))
    && Math.abs(value.x as number) <= 500 && Math.abs(value.y as number) <= 500
    && (value.scale as number) >= 0.05 && (value.scale as number) <= 20
    && typeof value.flipX === 'boolean' && typeof value.flipY === 'boolean';
}
function validElement(value: unknown): value is SceneElement {
  return record(value) && validTransform(value.desktop) && (value.mobile === undefined || validTransform(value.mobile)) && typeof value.deleted === 'boolean' && typeof value.locked === 'boolean';
}
export function parseSceneChapter(value: unknown, chapter?: SceneChapterId): SceneChapter {
  if (!record(value) || value.version !== 1 || ![1, 2, 3, 4, 5].includes(value.chapter as number) || chapter !== undefined && value.chapter !== chapter || !validElement(value.defaults)) throw new Error('Неверный формат или номер главы в JSON.');
  const id = value.chapter as SceneChapterId;
  if (!Array.isArray(value.frames) || value.frames.length !== chapterLengths[id]) throw new Error('JSON должен содержать все кадры главы.');
  const safeId = (key: unknown) => typeof key === 'string' && key.length > 0 && key.length <= 1000 && !['__proto__', 'constructor', 'prototype'].includes(key);
  for (const [index, frame] of value.frames.entries()) {
    if (!record(frame) || frame.paragraph !== index || typeof frame.comment !== 'string' || frame.comment.length > 20000 || !record(frame.variants) || !Object.hasOwn(frame.variants, 'start') || Object.keys(frame.variants).length > 100) throw new Error('Неверные кадры или комментарии в JSON.');
    for (const [name, variant] of Object.entries(frame.variants)) {
      if (!safeId(name) || !record(variant) || !record(variant.elements) || Object.keys(variant.elements).length > 10000 || !Object.entries(variant.elements).every(([key, element]) => safeId(key) && (element === null || validElement(element))) || !Array.isArray(variant.clones) || variant.clones.length > 1000 || !variant.clones.every(clone => record(clone) && safeId(clone.id) && safeId(clone.source)) || new Set(variant.clones.map(clone => clone.id)).size !== variant.clones.length) throw new Error('Неверные объекты или копии в JSON.');
      const clones = variant.clones as SceneClone[];
      if (clones.some(clone => clone.id === clone.source || clones.some(other => other.id === clone.source))) throw new Error('Копия должна ссылаться на исходный объект.');
    }
  }
  return structuredClone(value) as unknown as SceneChapter;
}
