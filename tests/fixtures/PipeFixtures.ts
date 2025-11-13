import { PipeShapes, PipeType } from "../../src/core/constants/PipeShapes";
import { GridPosition } from "../../src/core/domain/grid/GridPosition";
import { Direction } from "../../src/core/domain/Direction";
import { Pipe } from "../../src/core/domain/pipe/Pipe";


export const createTestPipe = (
  x = 0,
  y = 0,
  type: PipeType = PipeType.Straight,
  direction: Direction = Direction.Right
): Pipe => {
  const position = GridPosition.createUnsafe(x, y);
  return new Pipe(position, PipeShapes[type], direction);
};

export const createStraightPipe = (x: number, y: number, direction: Direction) =>
  createTestPipe(x, y, PipeType.Straight, direction);

export const createCornerPipe = (x: number, y: number, direction: Direction) =>
  createTestPipe(x, y, PipeType.Corner, direction);

export const createCrossPipe = (x: number, y: number, direction: Direction) =>
  createTestPipe(x, y, PipeType.Cross, direction);

export const createStartPipe = (x: number, y: number, direction: Direction) =>
  createTestPipe(x, y, PipeType.Start, direction);