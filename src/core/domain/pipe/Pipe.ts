import { rotateConnections } from "../../../utils/RotateConnections";
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

/** Represents a single pipe piece on the grid. */
export class Pipe extends PipeBase {
  readonly ports: Map<Direction, PipePort>;
  private _isBeingBombed: boolean = false;
  private _bombStartTime: number = 0;

  constructor(
    public readonly position: GridPosition,
    readonly shape: PipeShape,
    readonly direction: Direction
  ) {
    super(shape, direction);

    const rotatedConnections = rotateConnections(shape.connections, direction);
    this.ports = new Map(rotatedConnections.map(d => [d, new PipePort(d)]));
  }

  /** Return all directions open for flow */
  get openPorts(): readonly Direction[] {
    return [...this.ports.values()]
      .filter(p => !p.used)
      .map(p => p.direction);
  }

  /** Returns a boolean indicating if the pipe has any port being used */
  get blocked() : boolean {
    return [...this.ports.values()].filter(p => p.used).length > 0 || this._isBeingBombed;
  }

  getNeighbor(direction: Direction, grid: Grid): Pipe | null {
    const neighborCell = grid.getValidNeighbor(this.position, direction);
    return neighborCell?.pipe ?? null;
  }

  startBombAnimation(currentTime: number): void {
    this._isBeingBombed = true;
    this._bombStartTime = currentTime;
  }

  getBombProgress(currentTime: number, duration: number): number {
    if (!this._isBeingBombed) return 0;
    const elapsed = currentTime - this._bombStartTime;
    return Math.min(elapsed / duration, 1);
  }

  resetBombState(): void {
    this._isBeingBombed = false;
    this._bombStartTime = 0;
  }

  /** Marks a port as used */
  markUsed(dir: Direction): void {
    this.ports.get(dir)!.used = true;
  }

  /** Checks if water can enter from this direction */
  accepts(dir: Direction): boolean {
    return this.ports.has(dir);
  }

  /** True if this pipe has an open connection facing the given direction */
  hasOpenPort(dir: Direction): boolean {
    const port = this.ports.get(dir);
    return !!port && !port.used;
  }

  /** Returns a string representation for debugging. */
  toString(): string {
    const portDirs = this.openPorts.map(d => d.toString()).join(",");
    return `${this.assetKey}(${portDirs}) at ${this.position}`;
  }
}