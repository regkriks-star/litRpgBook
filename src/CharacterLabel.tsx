import SceneObject from './SceneObject';
export default function CharacterLabel({ name, profession, level }: { name: string; profession?: string; level?: number }) {
  return <SceneObject id="CharacterLabel-character-label-1" kind="group"><div className="character-label" aria-label={`${name}${profession ? `, ${profession}` : ''}${level === undefined ? '' : `, ${level} уровень`}`}>
    <strong>{name}</strong><span>{profession}{profession && level !== undefined && <SceneObject id="CharacterLabel-i-1" kind="effect"><i aria-hidden="true"> · </i></SceneObject>}{level !== undefined && <><b>{level}</b> уровень</>}</span>
  </div></SceneObject>;
}
