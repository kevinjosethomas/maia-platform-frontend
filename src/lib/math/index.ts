export const distToLine = (
  [x, y]: [number, number],
  [a, b, c]: [number, number, number],
) => {
  return (a * x + b * y + c) / Math.sqrt(Math.pow(a, 2) + Math.pow(a, 2))
}
