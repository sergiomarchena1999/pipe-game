import { PipeType } from "../core/Pipe";


/**
 * Type-safe game configuration interface.
 */
export interface IGameConfig {
  readonly queueSize: number,
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
  readonly pipeWeights: Record<PipeType, number>;
  readonly flowStartDelaySeconds: number;
  readonly pipeFlowSpeed: number;
}

/**
 * Validates that all weights are positive and sum to > 0.
 */
function validatePipeWeights(weights: Record<PipeType, number>): void {
  const entries = Object.entries(weights);
  if (entries.length === 0) {
    throw new Error("Pipe weights must not be empty");
  }

  let total = 0;
  for (const [type, weight] of entries) {
    if (type == PipeType.Start) continue;

    if (weight <= 0 || !isFinite(weight)) {
      throw new Error(`Invalid weight for ${type}: ${weight}`);
    }
    total += weight;
  }

  if (total <= 0) {
    throw new Error("Total pipe weight must be greater than zero");
  }
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
  if (config.grid.width <= 0 || config.grid.height <= 0) {
    throw new Error("Grid dimensions must be positive");
  }

  if (config.queueSize <= 0) {
    throw new Error("Queue size must be positive");
  }

  if (config.grid.cellSize <= 0) {
    throw new Error("Cell size must be positive");
  }

  if (config.pipeFlowSpeed < 0) {
    throw new Error("Pipe Flow Speed must be positive");
  }

  if (config.flowStartDelaySeconds < 0) {
    throw new Error("Pipe Flow Start Delay must be positive");
  }

  if (config.canvas.width <= 0 || config.canvas.height <= 0) {
    throw new Error("Canvas dimensions must be positive");
  }

  validatePipeWeights(config.pipeWeights);

  if (!isValidHexColor(config.canvas.backgroundColor)) {
    throw new Error(`Invalid background color: ${config.canvas.backgroundColor}`);
  }

  return Object.freeze({
    queueSize: config.queueSize,
    grid: Object.freeze({ ...config.grid }),
    canvas: Object.freeze({ ...config.canvas }),
    pipeWeights: Object.freeze({ ...config.pipeWeights }),
    flowStartDelaySeconds: config.flowStartDelaySeconds,
    pipeFlowSpeed: config.pipeFlowSpeed
  });
}

/**
 * Application-wide game configuration.
 * Frozen to prevent accidental modifications.
 */
export const GameConfig: IGameConfig = createGameConfig({
  queueSize: 5,
  grid: {
    width: 8,
    height: 8,
    cellSize: 32,
  },
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: "#00a187",
  },
  pipeWeights: {
    [PipeType.Start]: 0,
    [PipeType.Straight]: 0.25,
    [PipeType.Corner]: 0.55,
    [PipeType.Cross]: 0.20,
  },
  flowStartDelaySeconds: 10,
  pipeFlowSpeed: 20,
});