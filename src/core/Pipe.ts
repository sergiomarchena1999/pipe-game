import { rotateConnections } from "../utils/rotateConnections";
import type { PipeShape } from "./constants/PipeShapes";
import type { GridCell } from "./GridCell";
import { Direction } from "./Direction";
import { PipeBase } from "./PipeBase";


/** Available pipe piece types, each with distinct connection patterns. */
class PipePort {
  constructor(
    public readonly direction: Direction,
    public used: boolean = false
  ) {}
}

/**
 * Represents a single pipe piece on the grid.
 * Immutable after construction to prevent invalid states.
 */
export class Pipe extends PipeBase {
  readonly ports: Map<Direction, PipePort>;

  constructor(
    public readonly position: GridCell,
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
    return `${this.assetKey}(${portDirs}) at ${this.position.x},${this.position.y}`;
  }
}