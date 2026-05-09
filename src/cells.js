// Cell-ID constants and predicates. Lives outside index.js / animation.js so
// the constant references aren't part of the index ↔ animation cycle.
//
// Cell-ID *integers* are an internal implementation detail. Public consumers
// reference cells by string kind name via the kind <-> id helpers below; that
// way we can renumber internally without breaking user code.

export const EMPTY = 0;
export const BODY = 1;
export const ACCENT = 2;
export const DARK = 3;
export const ACCENT_NARROW = 4;
export const DARK_NARROW = 5;
export const ACCENT_NARROW_RIGHT = 6;
export const DARK_NARROW_RIGHT = 7;
export const EYE_DARK_LEFT = 8;
export const EYE_DARK_RIGHT = 9;
export const EYE_LIGHT_LEFT = 10;
export const EYE_LIGHT_RIGHT = 11;

// Stable string names for each cell. Order matches the integer table above.
export const CELL_KINDS = Object.freeze([
  'empty',
  'body',
  'accent',
  'dark',
  'accent-narrow-left',
  'dark-narrow-left',
  'accent-narrow-right',
  'dark-narrow-right',
  'eye-dark-left',
  'eye-dark-right',
  'eye-light-left',
  'eye-light-right'
]);

const KIND_TO_ID = Object.freeze(
  Object.fromEntries(CELL_KINDS.map((kind, id) => [kind, id]))
);

export function kindOf(cell) {
  return CELL_KINDS[cell];
}

export function idOfKind(kind) {
  if (!(kind in KIND_TO_ID)) {
    throw new Error(`Unknown cell kind "${kind}". Known kinds: ${CELL_KINDS.join(', ')}.`);
  }
  return KIND_TO_ID[kind];
}

export function isEye(cell) {
  return cell === EYE_DARK_LEFT
    || cell === EYE_DARK_RIGHT
    || cell === EYE_LIGHT_LEFT
    || cell === EYE_LIGHT_RIGHT;
}

export function isCompositeEye(cell) {
  return isEye(cell);
}

export function isNarrowLeft(cell) {
  return cell === ACCENT_NARROW || cell === DARK_NARROW;
}

export function isNarrowRight(cell) {
  return cell === ACCENT_NARROW_RIGHT || cell === DARK_NARROW_RIGHT;
}
