import { cloneElement, createContext, isValidElement, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactElement, type ReactNode, type Ref } from 'react';
import { clonesAt, elementAt, transformAt, type SceneChapter, type SceneChapterId, type SceneViewport } from './scene-layout';
import { readSceneDocument, subscribeSceneDocuments } from './scene-documents';

export type SceneObjectKind = 'sprite' | 'effect' | 'control' | 'group';
export type SceneObjectInfo = { id: string; source: string; label: string; kind: SceneObjectKind; x: number; y: number; width: number; height: number; parentScaleX: number; parentScaleY: number; deleted: boolean; transform: ReturnType<typeof transformAt> };
export type SceneGesture = { type: 'select'; id: string } | { type: 'move'; id: string; x: number; y: number; finished: boolean };
type FrameProps = { chapter: SceneChapterId; frame: number; variant?: string; children: ReactNode; document?: SceneChapter; viewport?: SceneViewport; editing?: boolean; selected?: string | null; onObject?: (info: SceneObjectInfo | null, id: string) => void; onGesture?: (gesture: SceneGesture) => void; onFrame?: (frame: number, variant: string) => void };
type SceneContextValue = FrameProps & { variant: string; viewport: SceneViewport; document: SceneChapter; path: string; sourcePath: string; scaleX: number; scaleY: number; hidden: boolean; cloned: boolean; excluded: boolean };
const SceneContext = createContext<SceneContextValue | null>(null);
type PreviewOptions = Omit<FrameProps, 'chapter' | 'frame' | 'children'>;
export const ScenePreviewOptions = createContext<PreviewOptions | null>(null);
export function SceneFrame(props: FrameProps) {
  const preview = useContext(ScenePreviewOptions);
  props = { ...props, ...preview, variant: preview?.variant ?? props.variant };
  const saved = useSyncExternalStore(subscribeSceneDocuments, () => readSceneDocument(props.chapter));
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 950px)').matches);
  useEffect(() => {
    const query = matchMedia('(max-width: 950px)');
    const change = () => setMobile(query.matches);
    query.addEventListener('change', change); return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => { props.onFrame?.(props.frame, props.variant ?? 'start'); }, [props.frame, props.variant, props.onFrame]);
  const context: SceneContextValue = { ...props, document: props.document ?? saved, variant: props.variant ?? 'start', viewport: props.viewport ?? (mobile ? 'mobile' : 'desktop'), path: '', sourcePath: '', scaleX: 1, scaleY: 1, hidden: false, cloned: false, excluded: false };
  return <SceneContext.Provider value={context}>{props.children}</SceneContext.Provider>;
}
export function SceneScope({ id, instanceKey, disabled, children }: { id: string; instanceKey?: string | number; disabled?: boolean; children: ReactNode }) {
  const context = useContext(SceneContext);
  const suffix = '/' + id + (instanceKey === undefined ? '' : ':' + instanceKey);
  return context ? <SceneContext.Provider value={{ ...context, excluded: context.excluded || Boolean(disabled), path: context.path + suffix, sourcePath: context.sourcePath + suffix }}>{children}</SceneContext.Provider> : <>{children}</>;
}
type NativeProps = { style?: CSSProperties; ref?: Ref<HTMLElement>; className?: string; children?: ReactNode; 'aria-label'?: string; onPointerDownCapture?: (event: React.PointerEvent<HTMLElement>) => void; onClickCapture?: (event: React.MouseEvent<HTMLElement>) => void; [key: string]: unknown };
function setRef(ref: Ref<HTMLElement> | undefined, node: HTMLElement | null) { if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }
const refOwners = new WeakMap<object, HTMLElement>();
function describe(node: ReactNode): string {
  if (typeof node === 'string') return node.trim();
  if (Array.isArray(node)) return node.map(describe).filter(Boolean).join(' ').slice(0, 120);
  if (isValidElement<Record<string, unknown>>(node)) {
    for (const key of ['aria-label', 'label', 'name']) if (typeof node.props[key] === 'string') return node.props[key] as string;
    return describe(node.props.children as ReactNode);
  }
  return '';
}
function parentMatrix(node: HTMLElement, includeNode = false) {
  let result = new DOMMatrix();
  for (let parent: HTMLElement | null = includeNode ? node : node.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    const transform = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
    const scales = style.scale === 'none' ? [1, 1] : style.scale.split(' ').map(Number);
    const rotation = style.rotate === 'none' ? 0 : parseFloat(style.rotate);
    const matrix = new DOMMatrix().rotate(rotation).scale(scales[0], scales[1] ?? scales[0]).multiply(transform);
    result = matrix.multiply(result);
  }
  result.e = 0; result.f = 0;
  return result;
}
export default function SceneObject({ id, instanceKey, kind = 'group', selectAsGroup, children }: { id: string; instanceKey?: string | number; kind?: SceneObjectKind; selectAsGroup?: boolean; children: ReactElement<NativeProps> }) {
  const context = useContext(SceneContext);
  if (!context || context.excluded) return children;
  const original = context.path + '/' + id + (instanceKey === undefined ? '' : ':' + instanceKey);
  const source = context.sourcePath + '/' + id + (instanceKey === undefined ? '' : ':' + instanceKey);
  const clones = clonesAt(context.document, context.frame, context.variant).filter(clone => clone.source === original);
  return <>{[original, ...clones.map(clone => clone.id)].map(instance => <ObjectInstance key={instance} id={instance} source={source} kind={kind} selectAsGroup={selectAsGroup} child={children} context={context} />)}</>;
}
function ObjectInstance({ id, source, kind, selectAsGroup, child, context }: { id: string; source: string; kind: SceneObjectKind; selectAsGroup?: boolean; child: ReactElement<NativeProps>; context: SceneContextValue }) {
  const node = useRef<HTMLElement | null>(null);
  const placement = useRef<Animation | null>(null);
  const drag = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const element = elementAt(context.document, context.frame, context.variant, id);
  const transform = transformAt(element, context.viewport);
  const deleted = context.hidden || element.deleted;
  const className = child.props.className?.split(' ')[0];
  const label = child.props['aria-label'] ?? ((selectAsGroup ? className : describe(child.props.children)) || className || id);
  const measure = () => {
    if (!node.current || !context.onObject) return;
    const rect = node.current.getBoundingClientRect();
    context.onObject({ id, source, label, kind, x: rect.x / innerWidth * 100, y: rect.y / innerHeight * 100, width: rect.width / innerWidth * 100, height: rect.height / innerHeight * 100, parentScaleX: context.scaleX, parentScaleY: context.scaleY, deleted, transform }, id);
  };
  useLayoutEffect(() => {
    if (!node.current) return;
    let animationFrame: number | undefined;
    const positioned = transform.x || transform.y || transform.scale !== 1 || transform.flipX || transform.flipY;
    if (!positioned && !context.onObject) return;
    const update = () => {
      placement.current?.cancel(); placement.current = null;
      const target = node.current; if (!target) return;
      if (positioned) {
        const x = transform.x / 100 * innerWidth, y = transform.y / 100 * innerHeight;
        const point = parentMatrix(target, true).inverse().transformPoint({ x, y });
        const localX = Number.isFinite(point.x) ? point.x : x, localY = Number.isFinite(point.y) ? point.y : y;
        const value = 'translate(' + localX + 'px,' + localY + 'px) scale(' + transform.scale * (transform.flipX ? -1 : 1) + ',' + transform.scale * (transform.flipY ? -1 : 1) + ')';
        // Add to the existing transform; CSS/JS animation and atlas registration stay intact.
        placement.current = target.animate([{ transform: value }, { transform: value }], { duration: 1, fill: 'both', composite: 'add' });
      }
      measure();
      if (positioned) {
        let moving = false;
        for (let parent: HTMLElement | null = target; parent; parent = parent.parentElement) {
          moving ||= parent.getAnimations().some(animation => (animation instanceof CSSAnimation || animation instanceof CSSTransition) && animation.playState === 'running');
        }
        if (moving) { if (animationFrame !== undefined) cancelAnimationFrame(animationFrame); animationFrame = requestAnimationFrame(update); }
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node.current);
    const timer = window.setTimeout(update, 200);
    return () => { observer.disconnect(); clearTimeout(timer); if (animationFrame !== undefined) cancelAnimationFrame(animationFrame); placement.current?.cancel(); context.onObject?.(null, id); };
  });
  useLayoutEffect(() => {
    const ref = child.props.ref;
    const original = ref && typeof ref !== 'function' ? ref.current : null;
    const copy = node.current;
    if (!(original instanceof HTMLDialogElement) || !(copy instanceof HTMLDialogElement) || original === copy) return;
    const sync = () => { if (original.open && !copy.open) copy.showModal(); else if (!original.open && copy.open) copy.close(); };
    const observer = new MutationObserver(sync); observer.observe(original, { attributes: true, attributeFilter: ['open'] }); sync();
    return () => observer.disconnect();
  }, [child.props.ref, id]);
  const pointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!context.editing) { child.props.onPointerDownCapture?.(event); return; }
    const closest = (event.target as HTMLElement).closest<HTMLElement>('[data-scene-object]');
    const group = (event.target as HTMLElement).closest<HTMLElement>('[data-scene-group]');
    const target = closest?.dataset.sceneObject === context.selected ? closest : group ?? closest;
    if (target !== node.current) return;
    event.preventDefault(); event.stopPropagation();
    context.onGesture?.({ type: 'select', id });
    if (element.locked || deleted || event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, offsetX: transform.x, offsetY: transform.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<HTMLElement>, finished: boolean) => {
    if (!drag.current) return;
    context.onGesture?.({ type: 'move', id, x: drag.current.offsetX + (event.clientX - drag.current.x) / innerWidth * 100, y: drag.current.offsetY + (event.clientY - drag.current.y) / innerHeight * 100, finished });
    if (finished) drag.current = null;
  };
  const style: CSSProperties = { ...child.props.style };
  if (deleted) { style.visibility = 'hidden'; style.pointerEvents = 'none'; }
  const next = { ...context, path: id, sourcePath: source, scaleX: context.scaleX * transform.scale * (transform.flipX ? -1 : 1), scaleY: context.scaleY * transform.scale * (transform.flipY ? -1 : 1), hidden: deleted, cloned: context.cloned || id !== source };
  return <SceneContext.Provider value={next}>{cloneElement(child, {
    style, ref: (value: HTMLElement | null) => {
      const previous = node.current; node.current = value;
      const ref = child.props.ref; if (!ref) return;
      const owner = refOwners.get(ref);
      if (value && (!context.cloned && id === source || !owner || owner === value)) { refOwners.set(ref, value); setRef(ref, value); }
      else if (!value && owner === previous) { refOwners.delete(ref); setRef(ref, null); }
    },
    'data-scene-object': id, 'data-scene-source': source, 'data-scene-kind': kind,
    'data-scene-selected': context.selected === id || undefined,
    'data-scene-deleted': deleted || undefined,
    'data-scene-group': selectAsGroup || undefined,
    'aria-hidden': deleted ? true : child.props['aria-hidden'], inert: deleted ? true : child.props.inert,
    onPointerDownCapture: pointerDown,
    onPointerMoveCapture: (event: React.PointerEvent<HTMLElement>) => move(event, false),
    onPointerUpCapture: (event: React.PointerEvent<HTMLElement>) => move(event, true),
    onPointerCancelCapture: () => { drag.current = null; },
    onClickCapture: (event: React.MouseEvent<HTMLElement>) => { if (context.editing) { event.preventDefault(); event.stopPropagation(); } else child.props.onClickCapture?.(event); },
  })}</SceneContext.Provider>;
}
