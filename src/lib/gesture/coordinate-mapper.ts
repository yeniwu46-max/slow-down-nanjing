export function normalizedToScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  mirror = true,
) {
  const screenX = mirror ? (1 - x) * width : x * width;
  const screenY = y * height;
  return { x: screenX, y: screenY };
}

export function normalizedToNdc(x: number, y: number, mirror = true) {
  const ndcX = mirror ? -(x * 2 - 1) : x * 2 - 1;
  const ndcY = -(y * 2 - 1);
  return { x: ndcX, y: ndcY };
}
