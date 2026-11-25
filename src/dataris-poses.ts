// Coordinates in each original 512 × 512 cell: crown jewel and finial spacing.
// Register the rigid throne, never the changing silhouette (hands, hair, dress).
export const datarisPoses = [
  { name: 'regal', anchor: [281.69, 14.73], throneWidth: 166 },
  { name: 'voice', anchor: [254.11, 15.75], throneWidth: 164 },
  { name: 'puzzled', anchor: [231.95, 15.71], throneWidth: 163 },
  { name: 'alarmed', anchor: [279.70, 8.28], throneWidth: 165 },
  { name: 'resolve', anchor: [253.55, 10.05], throneWidth: 164 },
  { name: 'cards', anchor: [232.66, 9.84], throneWidth: 163 },
] as const;

// Rectangles in the generated 1254² atlas. Its second row starts at y=575,
// not at half the image. Registration uses the rigid throne, including when
// Dataris stands; never resize a pose to its silhouette's bounding box.
export const datarisGestures = [
  { name: 'reading', rect: [0, 0, 418, 575], anchor: [225, 26], throneWidth: 185 },
  { name: 'shy', rect: [418, 0, 418, 575], anchor: [210, 26], throneWidth: 181 },
  { name: 'clap', rect: [836, 0, 418, 575], anchor: [199, 25], throneWidth: 183 },
  // Crown is behind her head; use the crown position inferred from the finials.
  { name: 'casting', rect: [0, 575, 418, 679], anchor: [226, 92], throneWidth: 185 },
  { name: 'covered', rect: [418, 575, 418, 679], anchor: [216, 98], throneWidth: 185 },
  { name: 'dismiss', rect: [836, 575, 418, 679], anchor: [198, 100], throneWidth: 185 },
] as const;

export function registeredGesture(pose: typeof datarisGestures[number]) {
  const [x, y, width, height] = pose.rect;
  const scale = 166 / pose.throneWidth;
  return {
    left: `${(313.69 - pose.anchor[0] * scale) / 576 * 100}%`,
    top: `${(46.73 - pose.anchor[1] * scale) / 576 * 100}%`,
    width: `${width * scale / 576 * 100}%`,
    height: `${height * scale / 576 * 100}%`,
    backgroundSize: `${1254 / width * 100}% ${1254 / height * 100}%`,
    backgroundPosition: `${x / (1254 - width) * 100}% ${y / (1254 - height) * 100}%`,
  };
}

export function registeredPose(pose: typeof datarisPoses[number]) {
  const scale = 166 / pose.throneWidth;
  // A shared padded canvas keeps extended hands inside the frame without fitting
  // each silhouette to its own box. No rotation or nonuniform stretching.
  return {
    left: `${(313.69 - pose.anchor[0] * scale) / 576 * 100}%`,
    top: `${(46.73 - pose.anchor[1] * scale) / 576 * 100}%`,
    width: `${512 * scale / 576 * 100}%`,
    height: `${512 * scale / 576 * 100}%`,
  };
}
