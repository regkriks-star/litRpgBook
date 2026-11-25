import one from './scenes/chapter-01.json';
import two from './scenes/chapter-02.json';
import three from './scenes/chapter-03.json';
import four from './scenes/chapter-04.json';
import five from './scenes/chapter-05.json';
import { parseSceneChapter, sceneStorageKey, type SceneChapter, type SceneChapterId } from './scene-layout';

const builtIn = { 1: one, 2: two, 3: three, 4: four, 5: five };
const cache = new Map<SceneChapterId, SceneChapter>();
const listeners = new Set<() => void>();
export function readSceneDocument(chapter: SceneChapterId): SceneChapter {
  if (!cache.has(chapter)) {
    let doc = parseSceneChapter(builtIn[chapter], chapter);
    try {
      const saved = localStorage.getItem(sceneStorageKey(chapter));
      if (saved) doc = parseSceneChapter(JSON.parse(saved), chapter);
    } catch { /* The packaged chapter remains usable if storage is unavailable or invalid. */ }
    cache.set(chapter, doc);
  }
  return cache.get(chapter)!;
}
export function saveSceneDocument(doc: SceneChapter) {
  let persisted = true;
  try { localStorage.setItem(sceneStorageKey(doc.chapter), JSON.stringify(doc)); }
  catch { persisted = false; }
  cache.set(doc.chapter, doc);
  listeners.forEach(listener => listener());
  return persisted;
}
export function subscribeSceneDocuments(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
