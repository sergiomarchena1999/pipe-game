/**
 * Type-safe game configuration interface.
 */
export interface IGameConfig {
  readonly grid: {
    readonly width: number;
    readonly height: number;
    readonly cellSize: number;
  };
  readonly canvas: {
    readonly width: number;
    readonly height: number;
    readonly backgroundColor: string;
  };
}

/**
 * Validates a hex color string.
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Creates and validates game configuration.
 * @throws {Error} if configuration is invalid
 */
function createGameConfig(config: IGameConfig): Readonly<IGameConfig> {
  // Validate grid dimensions
  if (config.grid.width <= 0 || config.grid.height <= 0) {
    throw new Error("Grid dimensions must be positive");
  }
  
  if (config.grid.cellSize <= 0) {
    throw new Error("Cell size must be positive");
  }

  // Validate canvas dimensions
  if (config.canvas.width <= 0 || config.canvas.height <= 0) {
    throw new Error("Canvas dimensions must be positive");
  }

  // Validate background color
  if (!isValidHexColor(config.canvas.backgroundColor)) {
    throw new Error(`Invalid background color: ${config.canvas.backgroundColor}`);
  }

  return Object.freeze({
    grid: Object.freeze({ ...config.grid }),
    canvas: Object.freeze({ ...config.canvas }),
  });
}

/**
 * Application-wide game configuration.
 * Frozen to prevent accidental modifications.
 */
export const GameConfig: IGameConfig = createGameConfig({
  grid: {
    width: 2,
    height: 2,
    cellSize: 32,
  },
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: "#00a187",
  },
});