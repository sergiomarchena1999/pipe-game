import type { GridCell } from "./GridCell";
import { Direction } from "./Direction";


/**
 * Available pipe piece types, each with distinct connection patterns.
 */
export enum PipeType {
  Straight = "straight",
  Corner = "corner",
  Cross = "cross",
  Start = "start",
}

export type WaterFlowState =
  | { status: "empty" }
  | { status: "delayed"; remaining: number } 
  | { status: "inProgress"; progress: number } // 0–100
  | { status: "full" };

/**
 * Represents a single pipe piece on the grid.
 * Immutable after construction to prevent invalid states.
 */
export class Pipe {
  private flowState: WaterFlowState = { status: "empty" };

  constructor(
    public readonly type: PipeType,
    public readonly position: GridCell,
    public readonly direction: Direction
  ) {}

  /**
   * Gets all open connection directions for this pipe.
   */
  getConnections(): readonly Direction[] {
    switch (this.type) {
      case PipeType.Straight:
        // Straight pipes only allow horizontal or vertical depending on orientation
        if (this.direction === Direction.Up || this.direction === Direction.Down) {
          return [Direction.Up, Direction.Down];
        } else {
          return [Direction.Left, Direction.Right];
        }

      case PipeType.Corner:
        switch (this.direction) {
          case Direction.Up:
            return [Direction.Left, Direction.Up];
          case Direction.Right:
            return [Direction.Up, Direction.Right];
          case Direction.Down:
            return [Direction.Right, Direction.Down];
          case Direction.Left:
            return [Direction.Down, Direction.Left];
          default:
            return [];
        }

      case PipeType.Cross:
        // Cross pipes always open in all directions
        return Direction.All;

      case PipeType.Start:
        // Only outputs in the facing direction
        return [this.direction];

      default:
        return [];
    }
  }

  /** Gets the asset key for rendering this pipe type. */
  get assetKey(): string {
    const assetKeyMap: Record<PipeType, string> = {
      [PipeType.Straight]: "pipe-straight",
      [PipeType.Corner]: "pipe-corner",
      [PipeType.Cross]: "pipe-cross",
      [PipeType.Start]: "pipe-start",
    };

    return assetKeyMap[this.type] ?? "pipe-unknown";
  }

  /** Returns current water state. */
  getFlowState(): WaterFlowState {
    return this.flowState;
  }

  /** Update call handles delay countdown and filling logic. */
  update(deltaTime: number, flowSpeed: number): void {
    switch (this.flowState.status) {
      case "delayed":
        const remaining = this.flowState.remaining - deltaTime;
        if (remaining <= 0) {
          this.flowState = { status: "inProgress", progress: 0 };
        } else {
          this.flowState = { status: "delayed", remaining };
        }
        break;

      case "inProgress":
        const deltaProgress = (flowSpeed * deltaTime) / 1000;
        this.advanceFlow(deltaProgress);
        break;
    }
  }

  /** Starts filling this pipe, optionally after a delay. */
  startFilling(startDelayMs = 0): void {
    if (!this.isEmpty()) return;

    if (startDelayMs > 0) {
      this.flowState = { status: "delayed", remaining: startDelayMs };
    } else {
      this.flowState = { status: "inProgress", progress: 0 };
    }
  }

  /** Advances flow by delta percentage, clamped to 100%. */
  private advanceFlow(delta: number): void {
    if (this.flowState.status !== "inProgress") return;

    const newProgress = Math.min(100, this.flowState.progress + delta);
    this.flowState =
      newProgress >= 100
        ? { status: "full" }
        : { status: "inProgress", progress: newProgress };

    console.warn(this.flowState);
  }

  /** Convenience checks. */
  isEmpty(): boolean {
    return this.flowState.status === "empty";
  }

  isFull(): boolean {
    return this.flowState.status === "full";
  }

  isFilling(): boolean {
    return this.flowState.status === "inProgress";
  }

  /** Returns a string representation for debugging. */
  toString(): string {
    return `pipe-${this.type}(${this.direction})`;
  }
}