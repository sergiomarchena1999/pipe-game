import type { IBombConfig, IGameConfig, IGridConfig, PipeWeights } from "./GameConfig";
import { PipeType } from "../core/constants/PipeShapes";


/** Validation error types. */
export type ConfigValidationError =
  | 'invalid_grid_dimensions'
  | 'grid_too_small'
  | 'invalid_queue_size'
  | 'invalid_cell_size'
  | 'invalid_bomb_timer'
  | 'invalid_max_bombs'
  | 'invalid_flow_speed'
  | 'invalid_flow_delay'
  | 'invalid_pipe_weights'
  | 'invalid_blocked_percentage';

/** Detailed validation result with specific error information. */
export interface ValidationError {
  readonly type: ConfigValidationError;
  readonly message: string;
  readonly field?: string;
}

/** Configuration validator with comprehensive error reporting. */
export class GameConfigValidator {
  /**
   * Validates a game configuration.
   * Returns all validation errors found, or empty array if valid.
   */
  static validate(config: IGameConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    // Grid validation
    errors.push(...this.validateGrid(config.grid));

    // Queue validation
    if (config.queue.maxSize <= 0) {
      errors.push({
        type: 'invalid_queue_size',
        message: `Queue size must be positive, got ${config.queue.maxSize}`,
        field: 'queueSize',
      });
    }

    // Pipe weights validation
    const weightError = this.validatePipeWeights(config.queue.pipeWeights);
    if (weightError) {
      errors.push(weightError);
    }

    // Bomb configuration validation
    errors.push(...this.validateBombConfig(config.bombConfig));

    // Flow configuration validation
    if (config.pipeFlowSpeed <= 0) {
      errors.push({
        type: 'invalid_flow_speed',
        message: `Flow speed must be positive, got ${config.pipeFlowSpeed}`,
        field: 'pipeFlowSpeed',
      });
    }

    if (config.flowStartDelaySeconds < 0) {
      errors.push({
        type: 'invalid_flow_delay',
        message: `Flow delay cannot be negative, got ${config.flowStartDelaySeconds}`,
        field: 'flowStartDelaySeconds',
      });
    }

    return errors;
  }

  /** Checks if configuration is valid (boolean check). */
  static isValid(config: IGameConfig): boolean {
    return this.validate(config).length === 0;
  }

  // ========================================================================
  // Private Validation Helpers
  // ========================================================================

  private static validateGrid(grid: IGridConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    // Dimensions must be positive
    if (grid.width <= 0 || grid.height <= 0) {
      errors.push({
        type: 'invalid_grid_dimensions',
        message: `Grid dimensions must be positive, got ${grid.width}x${grid.height}`,
        field: 'grid.width/height',
      });
    }

    // Minimum size when start pipe can be on edge
    if (grid.allowStartPipeOnEdge && (grid.width < 3 || grid.height < 3)) {
      errors.push({
        type: 'grid_too_small',
        message: `Grid must be at least 3x3 when allowStartPipeOnEdge is true, got ${grid.width}x${grid.height}`,
        field: 'grid.width/height',
      });
    }

    // Cell size must be positive
    if (grid.cellSize <= 0) {
      errors.push({
        type: 'invalid_cell_size',
        message: `Cell size must be positive, got ${grid.cellSize}`,
        field: 'grid.cellSize',
      });
    }

    // Blocked percentage validation
    if (
      grid.blockedPercentage < 0 ||
      grid.blockedPercentage >= 100
    ) {
      errors.push({
        type: 'invalid_blocked_percentage',
        message: `Blocked percentage must be between 0 and 100, got ${grid.blockedPercentage}`,
        field: 'grid.blockedPercentage',
      });
    }

    return errors;
  }

  private static validateBombConfig(config: IBombConfig): ValidationError[] {
    const errors: ValidationError[] = [];
    if (config.bombTimerSeconds <= 0) {
      errors.push({
        type: 'invalid_bomb_timer',
        message: `Bomb timer must be positive, got ${config.bombTimerSeconds}`,
        field: 'bombConfig.bombTimerSeconds',
      });
    }

    if (config.maxBombs <= 0) {
      errors.push({
        type: 'invalid_max_bombs',
        message: `Max bombs must be positive, got ${config.maxBombs}`,
        field: 'bombConfig.maxBombs',
      });
    }

    return errors;
  }

  private static validatePipeWeights(weights: PipeWeights): ValidationError | null {
    // Start pipe should always be 0
    if (weights[PipeType.Start] !== 0) {
      return {
        type: 'invalid_pipe_weights',
        message: 'Start pipe weight must be 0',
        field: 'pipeWeights.start',
      };
    }

    // Calculate total weight (excluding start)
    let total = 0;
    const entries: Array<[PipeType, number]> = [
      [PipeType.Straight, weights[PipeType.Straight]],
      [PipeType.Corner, weights[PipeType.Corner]],
      [PipeType.Cross, weights[PipeType.Cross]],
    ];

    for (const [type, weight] of entries) {
      // Each weight must be valid
      if (weight < 0 || !isFinite(weight)) {
        return {
          type: 'invalid_pipe_weights',
          message: `Invalid weight for ${type}: ${weight}`,
          field: `pipeWeights.${type}`,
        };
      }
      total += weight;
    }

    // Total must be positive
    if (total <= 0) {
      return {
        type: 'invalid_pipe_weights',
        message: 'Total pipe weight must be greater than zero',
        field: 'pipeWeights',
      };
    }

    return null;
  }
}