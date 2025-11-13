import { GridPosition } from "../../src/core/domain/grid/GridPosition";
import { Grid } from "../../src/core/domain/grid/Grid";
import { Pipe } from "../../src/core/domain/pipe/Pipe";

import type { ILogger } from "../../src/core/logging/ILogger";
import { createTestGridConfig } from './GameConfigFixtures';
import { createMockLogger } from './LoggerFixtures';


export const createTestGrid = (
  width = 10,
  height = 8,
  logger: ILogger = createMockLogger()
): Grid => {
  const config = createTestGridConfig({ width, height });
  return new Grid(config, logger);
};

export const createInitializedGrid = (
  width = 10,
  height = 8,
  logger: ILogger = createMockLogger()
): Grid => {
  const grid = createTestGrid(width, height, logger);
  grid.initialize();
  return grid;
};

export const createGridWithPipes = (
  pipes: Array<{ x: number; y: number; pipe: Pipe }>,
  logger: ILogger = createMockLogger()
): Grid => {
  const grid = createInitializedGrid(10, 8, logger);
  
  pipes.forEach(({ x, y, pipe }) => {
    const position = GridPosition.createUnsafe(x, y);
    const cell = grid.getCell(position);
    grid.setPipe(cell, pipe);
  });
  
  return grid;
};