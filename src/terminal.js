export function hideCursor(stream) {
  stream.write('[?25l');
}

export function showCursor(stream) {
  stream.write('[?25h');
}

export function cursorUp(stream, n) {
  stream.write(`[${n}A\r`);
}

export function enterAltBuffer(stream) {
  stream.write('[?1049h');
}

export function leaveAltBuffer(stream) {
  stream.write('[?1049l');
}

export function moveCursor(stream, row, col) {
  stream.write(`[${row};${col}H`);
}

export function clearScreen(stream) {
  stream.write('[2J[H');
}

export function getSize(stream) {
  return {
    columns: Number.isFinite(stream?.columns) ? stream.columns : 80,
    rows: Number.isFinite(stream?.rows) ? stream.rows : 24
  };
}

export function setRawMode(input, on) {
  if (input && typeof input.setRawMode === 'function') {
    input.setRawMode(on);
  }
}
