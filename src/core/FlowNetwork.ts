import type { ILogger } from "./logging/ILogger";
import type { Direction } from "./Direction";
import type { Grid } from "./Grid";
import type { Pipe } from "./Pipe";


interface ActivePipeState {
  pipe: Pipe;
  entryDir: Direction;
  exitDir: Direction | null;
  progress: number;       // 0–100
  delayRemaining: number; // seconds
}

/** Central flow network */
export class FlowNetwork {
  private static activeStates: ActivePipeState[] = [];
  private static visitedPorts = new Map<Pipe, Set<Direction>>();

  static initialize(grid: Grid, logger: ILogger, startDelaySeconds = 0) {
    const startPipe = grid.startPipe;
    if (!startPipe) return;

    this.activeStates = [{
      pipe: startPipe,
      entryDir: startPipe.direction,
      exitDir: startPipe.getOpenPorts()[0],
      progress: 0,
      delayRemaining: startDelaySeconds,
    }];

    this.visitedPorts = new Map();
    logger.info(`Flow initialized at ${startPipe.position} with delay ${startDelaySeconds}s`);
  }

  static update(delta: number, speed: number, grid: Grid, logger: ILogger) {
    const newStates: ActivePipeState[] = [];

    for (const state of this.activeStates) {
      if (state.delayRemaining > 0) {
        state.delayRemaining -= delta;
        newStates.push(state);
        continue;
      }

      if (!state.exitDir) {
        state.exitDir = this.getNextExit(state.pipe, state.entryDir);
        if (!state.exitDir) continue;
      }

      // advance progress
      state.progress += speed * delta;
      if (state.progress < 100) {
        newStates.push(state);
        continue;
      }

      // move to next pipe
      const nextPos = {
        x: state.pipe.position.x + state.exitDir.dx,
        y: state.pipe.position.y + state.exitDir.dy,
      };

      if (!grid.isValidPosition(nextPos.x, nextPos.y)) continue;

      const nextPipe = grid.getPipeAt(nextPos.x, nextPos.y);
      if (!nextPipe || !nextPipe.accepts(state.exitDir.opposite)) continue;

      state.pipe.markUsed(state.exitDir);
      nextPipe.markUsed(state.exitDir.opposite);
      this.addVisited(state.pipe, state.exitDir);
      this.addVisited(nextPipe, state.exitDir.opposite);

      // enqueue next pipe with no progress and 0 delay
      newStates.push({
        pipe: nextPipe,
        entryDir: state.exitDir.opposite,
        exitDir: null,
        progress: 0,
        delayRemaining: 0,
      });

      logger.info(`Flow advanced from ${state.pipe.position} to ${nextPipe.position}`);
    }

    this.activeStates = newStates;
  }

  private static getNextExit(pipe: Pipe, entryDir: Direction): Direction | null {
    const openPorts = pipe.getOpenPorts().filter(d => d !== entryDir);
    if (openPorts.length === 0) return null;

    const visited = this.visitedPorts.get(pipe);
    if (visited && visited.size === 1) {
      const [entry] = [...visited];
      const straight = entry.opposite;
      if (openPorts.includes(straight)) return straight;
    }

    return openPorts[0];
  }

  private static addVisited(pipe: Pipe, dir: Direction) {
    if (!this.visitedPorts.has(pipe)) this.visitedPorts.set(pipe, new Set());
    this.visitedPorts.get(pipe)!.add(dir);
  }

  static getActiveState(): ActivePipeState {
    return this.activeStates[0];
  }

  static getVisitedPortsSnapshot(): Array<{ pipe: Pipe; dirs: Direction[] }> {
    const out: Array<{ pipe: Pipe; dirs: Direction[] }> = [];
    for (const [pipe, set] of this.visitedPorts.entries()) {
      out.push({ pipe, dirs: Array.from(set) });
    }
    return out;
  }
}