import { useCallback, useEffect, useRef, useState } from 'react';
import ChapterOne from './ChapterOne';
import ChapterTwo from './ChapterTwo';
import ChapterThree from './ChapterThree';
import ChapterFour from './ChapterFour';
import ChapterFive from './ChapterFive';
import { ScenePreviewOptions, type SceneGesture, type SceneObjectInfo } from './SceneObject';
import { chapterReplay } from './scene-replay';
import { chapterLengths, parseSceneChapter, type SceneChapter, type SceneChapterId, type SceneViewport } from './scene-layout';
import { readSceneDocument } from './scene-documents';
import './scene-editor.css';

export function prepareScenePreview() {
  const query = new URLSearchParams(location.search);
  document.documentElement.classList.add('scene-preview');
  if (query.get('ghost') === '1') document.documentElement.classList.add('scene-ghost');
  if (query.get('motion') !== 'play') {
    document.documentElement.classList.add('scene-still');
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const result = original(query);
      if (query !== '(prefers-reduced-motion: reduce)') return result;
      return new Proxy(result, { get(target, property) {
        if (property === 'matches') return true;
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      } });
    };
  }
}
export default function ScenePreview() {
  const query = new URLSearchParams(location.search);
  const requestedChapter = Number(query.get('chapter'));
  const chapter: SceneChapterId = [1, 2, 3, 4, 5].includes(requestedChapter) ? requestedChapter as SceneChapterId : 1;
  const requestedFrame = Number(query.get('frame') ?? 0);
  const frame = Number.isInteger(requestedFrame) ? Math.max(0, Math.min(requestedFrame, chapterLengths[chapter] - 1)) : 0;
  const states = chapterReplay(chapter)[frame];
  const state = states.find(state => state.id === query.get('variant')) ?? states[0];
  const role = query.get('ghost') === '1' ? 'ghost' : 'current';
  const [doc, setDoc] = useState<SceneChapter>(() => readSceneDocument(chapter));
  const [editing, setEditing] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState(state.id);
  const objects = useRef(new Map<string, SceneObjectInfo>());
  const scheduled = useRef<number | undefined>(undefined);
  const post = useCallback((message: Record<string, unknown>) => parent.postMessage({ ...message, type: 'litrpg:scene-preview', role, chapter, frame, variant: state.id }, location.origin), [role, chapter, frame, state.id]);
  const report = useCallback((info: SceneObjectInfo | null, id: string) => {
    if (info) objects.current.set(id, info); else objects.current.delete(id);
    clearTimeout(scheduled.current);
    scheduled.current = window.setTimeout(() => post({ event: 'objects', objects: Array.from(objects.current.values()) }), 20);
  }, [post]);
  const gesture = useCallback((gesture: SceneGesture) => post({ event: 'gesture', gesture }), [post]);
  const onFrame = useCallback((currentFrame: number, currentVariant: string) => post({ event: 'frame', currentFrame, currentVariant }), [post]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'litrpg:scene-layout') return;
      try { setDoc(parseSceneChapter(event.data.document, chapter)); } catch { return; }
      setEditing(Boolean(event.data.editing)); setSelected(typeof event.data.selected === 'string' ? event.data.selected : null);
      if (states.some(state => state.id === event.data.variant)) setActiveVariant(event.data.variant);
      document.documentElement.classList.toggle('scene-hide-story', Boolean(event.data.hideStory));
      document.documentElement.classList.toggle('scene-editing', Boolean(event.data.editing));
    };
    const key = (event: KeyboardEvent) => {
      if (!editing || role === 'ghost' || event.repeat) return;
      const ctrl = event.ctrlKey || event.metaKey;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Backspace'].includes(event.key) && !(ctrl && ['c', 'v', 'z', 'y'].includes(event.key.toLowerCase()))) return;
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable=true]')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      post({ event: 'key', key: event.key, ctrlKey: event.ctrlKey || event.metaKey, shiftKey: event.shiftKey });
    };
    addEventListener('message', receive); addEventListener('keydown', key, true);
    post({ event: 'ready' });
    return () => { removeEventListener('message', receive); removeEventListener('keydown', key, true); clearTimeout(scheduled.current); };
  }, [chapter, post, editing, role, states]);
  const contents = () => post({ event: 'contents' });
  const viewport: SceneViewport = query.get('viewport') === 'mobile' ? 'mobile' : 'desktop';
  return <ScenePreviewOptions.Provider value={{ document: doc, viewport, variant: editing || role === 'ghost' ? activeVariant : undefined, editing: role === 'current' && editing, selected, onObject: report, onGesture: gesture, onFrame }}>
    {chapter === 1 && <ChapterOne onContents={contents} preview={{ page: frame }} />}
    {chapter === 2 && <ChapterTwo onContents={contents} onChapterThree={contents} preview={state.two!} />}
    {chapter === 3 && <ChapterThree onContents={contents} onChapterFour={contents} preview={state.three!} />}
    {chapter === 4 && <ChapterFour onContents={contents} onChapterFive={contents} preview={state.four!} />}
    {chapter === 5 && <ChapterFive onContents={contents} preview={state.five!} />}
  </ScenePreviewOptions.Provider>;
}
