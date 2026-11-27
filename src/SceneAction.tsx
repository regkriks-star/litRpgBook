/** An invisible, keyboard-accessible hit area placed over an object that is
 * already drawn in the scene. The object itself becomes the control; the action
 * name stays available to screen readers and as a desktop tooltip. */
export default function SceneAction({ label, onClick, task }: { label: string; onClick: () => void; task?: string }) {
  return <button type="button" className="scene-action" aria-label={label} title={label} data-task={task} onClick={event => { event.stopPropagation(); onClick(); }} />;
}
