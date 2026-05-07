// Cell-ID constants and predicates. Lives outside index.js / animation.js so
// the constant references aren't part of the index ↔ animation cycle.

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
