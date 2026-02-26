export enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export const DIR_DELTA: Record<Direction, [number, number]> = {
  [Direction.Up]: [0, -1],
  [Direction.Down]: [0, 1],
  [Direction.Left]: [-1, 0],
  [Direction.Right]: [1, 0],
};
