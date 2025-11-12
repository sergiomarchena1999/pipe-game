import type { GridPosition } from "../grid/GridPosition";
import type { PipeShape } from "../../constants/PipeShapes";
import type { Grid } from "../grid/Grid";

import { Direction } from "../Direction";
import { PipeBase } from "./PipeBase";


/** Available pipe piece types, each with distinct connection patterns. */
class PipePort {
  constructor(
    public readonly direction: Direction,
    public used: boolean = false
  ) {}
}

interface BombState {
  readonly isBombing: boolean;
  readonly startTime: number;
}

/**
 * Represents a single pipe piece placed on the grid.
 * Manages connection ports and their usage state.
 */
export class Pipe extends PipeBase {
  private readonly ports: Map<Direction, PipePort>;
  private bombState: BombState;

  constructor(
    public readonly position: GridPosition,
    readonly shape: PipeShape,
    readonly direction: Direction
  ) {
    super(shape, direction);

    const rotatedConnections = this.rotateConnections(shape.connections, direction);
    this.ports = new Map(rotatedConnections.map(d => [d, new PipePort(d)]));
    this.bombState = { isBombing: false, startTime: 0 };
  }

  // ============================================================================
  // Port Management
  // ============================================================================

  /** Return all directions open for flow */
  get openPorts(): readonly Direction[] {
    return Array.from(this.ports.values())
      .filter(p => !p.used)
      .map(p => p.direction);
  }

  /** Returns all used ports (already has water flowing). */
  get usedPorts(): readonly Direction[] {
    return Array.from(this.ports.values())
      .filter(p => p.used)
      .map(p => p.direction);
  }

  /** Returns a boolean indicating if the pipe has any port being used */
  get isBlocked(): boolean {
    return this.usedPorts.length > 0 || this.bombState.isBombing;
  }

  /** Checks if water can enter from this direction */
  accepts(dir: Direction): boolean {
    return this.ports.has(dir);
  }

  /** Checks if this pipe has an open connection facing the given direction */
  hasOpenPort(dir: Direction): boolean {
    const port = this.ports.get(dir);
    return !!port && !port.used;
  }

  /**
   * Marks a port as used (water is flowing through it).
   * @throws {Error} if direction is not a valid port
   */
  markPortUsed(dir: Direction): void {
    const port = this.ports.get(dir);
    if (!port) {
      throw new Error(`Cannot mark non-existent port ${dir} as used on pipe at ${this.position}`);
    }
    port.used = true;
  }

  // ============================================================================
  // Bomb Animation State
  // ============================================================================

  /**
   * Starts a bomb animation on this pipe.
   */
  startBombAnimation(currentTime: number): void {
    this.bombState = { isBombing: true, startTime: currentTime };
  }

  /**
   * Calculates the current bomb animation progress (0.0 to 1.0).
   */
  getBombProgress(currentTime: number, durationSeconds: number): number {
    if (!this.bombState.isBombing) {
      return 0;
    }
    const elapsed = currentTime - this.bombState.startTime;
    return Math.min(elapsed / durationSeconds, 1);
  }

  /**
   * Checks if this pipe is currently being bombed.
   */
  get isBombing(): boolean {
    return this.bombState.isBombing;
  }

  /**
   * Resets the bomb state (call after bomb completes or is cancelled).
   */
  resetBombState(): void {
    this.bombState = { isBombing: false, startTime: 0 };
  }

  // ============================================================================
  // Position & rotation Helpers
  // ============================================================================

  // TODO: Remove grid dependency
  getNeighbor(direction: Direction, grid: Grid): Pipe | null {
    const neighborCell = grid.getValidNeighbor(this.position, direction);
    return neighborCell?.pipe ?? null;
  }

  /**
   * Rotates a list of directions to match a given facing direction.
   * Assumes the shape's default orientation is facing Right (0°).
   *
   * This implementation rotates by angle instead of relying on array index order.
   */
  private rotateConnections(connections: readonly Direction[], facing: Direction): Direction[] {
    // Right is the shape's default facing (0°)
    const rightAngle = Direction.Right.angle; // should be 0
    const targetAngle = facing.angle;

    // number of degrees to rotate clockwise
    const rotateDegrees = ((targetAngle - rightAngle) + 360) % 360;

    return connections.map(orig => {
      const newAngle = (orig.angle + rotateDegrees) % 360;
      return Direction.fromAngle(newAngle);
    });
  }

  /** Returns a string representation for debugging. */
  toString(): string {
    const portDirs = this.openPorts.map(d => d.toString()).join(",");
    return `${this.assetKey}(${portDirs}) at ${this.position}`;
  }
}