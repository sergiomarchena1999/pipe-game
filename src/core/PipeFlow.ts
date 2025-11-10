import EventEmitter from "eventemitter3";
import type { Direction } from "./Direction";
import type { Pipe } from "./Pipe";


export type WaterFlowState =
  | { status: "empty" }
  | { status: "delayed"; remaining: number }
  | { status: "filling"; progress: number } // 0–100
  | { status: "seeking" } // Water has reached 50%, looking for exit
  | { status: "full" };

export interface FlowEventData {
  pipe: Pipe;
  exitDirection: Direction | null;
}

export type FlowEvents = {
  flowStarted: (data: FlowEventData) => void;
  flowReached50: (data: FlowEventData) => void;
  flowCompleted: (data: FlowEventData) => void;
};

export class PipeFlow extends EventEmitter<FlowEvents> {
  private state: WaterFlowState = { status: "empty" };
  private entryDirection: Direction | null = null;
  private exitDirection: Direction | null = null;

  constructor(private readonly pipe: Pipe) {
    super();
  }

  /** Start water entering this pipe from a specific direction */
  startFilling(fromDirection: Direction, startDelaySeconds = 0): void {
    if (this.state.status !== "empty") return;

    this.entryDirection = fromDirection;

    if (startDelaySeconds > 0) {
      this.state = { status: "delayed", remaining: startDelaySeconds };
    } else {
      this.state = { status: "filling", progress: 0 };
      this.emit("flowStarted", {
        pipe: this.pipe,
        exitDirection: null
      });
    }
  }

  /** Update the water flow state */
  update(deltaTime: number, flowSpeed: number): void {
    switch (this.state.status) {
      case "delayed":
        const remaining = this.state.remaining - deltaTime;
        if (remaining <= 0) {
          this.state = { status: "filling", progress: 0 };
          this.emit("flowStarted", {
            pipe: this.pipe,
            exitDirection: null
          });
        } else {
          this.state = { status: "delayed", remaining };
        }
        break;

      case "filling":
        const deltaProgress = (flowSpeed * deltaTime);
        const newProgress = Math.min(100, this.state.progress + deltaProgress);
        
        // Check if we've reached the halfway point
        if (this.state.progress < 50 && newProgress >= 50) {
          this.state = { status: "seeking" };
          this.emit("flowReached50", {
            pipe: this.pipe,
            exitDirection: null
          });
        } else if (newProgress >= 100) {
          this.state = { status: "full" };
          this.emit("flowCompleted", {
            pipe: this.pipe,
            exitDirection: this.exitDirection
          });
        } else {
          this.state = { status: "filling", progress: newProgress };
        }
        break;
    }
  }

  /** Called when an exit route is found (by the manager) */
  confirmExit(exitDir: Direction): void {
    if (this.state.status === "seeking") {
      this.exitDirection = exitDir;
      this.state = { status: "filling", progress: 50 };
    }
  }

  /** Called when no exit is found - just continue filling */
  noExitFound(): void {
    if (this.state.status === "seeking") {
      this.exitDirection = null;
      this.state = { status: "filling", progress: 50 };
    }
  }

  // Getters
  getState(): WaterFlowState {
    return this.state;
  }

  getEntryDirection(): Direction | null {
    return this.entryDirection;
  }

  getExitDirection(): Direction | null {
    return this.exitDirection;
  }

  isEmpty(): boolean {
    return this.state.status === "empty";
  }

  isSeeking(): boolean {
    return this.state.status === "seeking";
  }

  isFull(): boolean {
    return this.state.status === "full";
  }

  reset(): void {
    this.state = { status: "empty" };
    this.entryDirection = null;
    this.exitDirection = null;
  }
}