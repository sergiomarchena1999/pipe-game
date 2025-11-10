import type { ILogger } from "./logging/ILogger";
import type { Direction } from "./Direction";
import type { Grid } from "./Grid";
import type { Pipe } from "./Pipe";


interface ActivePipeState {
  pipe: Pipe;
  entryDir: Direction | null;
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
      entryDir: null,
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

      // ensure we know the exit direction for this pipe (may be null if dead-end)
      if (state.entryDir && !state.exitDir) {
        state.exitDir = this.getNextExit(state.pipe, state.entryDir);
      }

      const prevProgress = state.progress;
      state.progress += speed * delta;

      // MARK ENTRY when the pipe reaches 50% filled (first time crossing 50%)
      if (state.entryDir && prevProgress < 50 && state.progress >= 50) {
        // mark the entry port as visited
        this.addVisited(state.pipe, state.entryDir);
        state.pipe.markUsed(state.entryDir);
      }

      if (state.progress < 100) {
        newStates.push(state);
        continue;
      }

      if (prevProgress < 100 && state.progress >= 100 && state.exitDir) {
        this.addVisited(state.pipe, state.exitDir);
        state.pipe.markUsed(state.exitDir);
      }

      // Move to next pipe only if there's a valid exit and a valid neighbor
      if (!state.exitDir) {
        // no exit -> flow stops here (do not enqueue a next pipe)
        continue;
      }

      const nextPos = {
        x: state.pipe.position.x + state.exitDir.dx,
        y: state.pipe.position.y + state.exitDir.dy,
      };

      if (!grid.isValidPosition(nextPos.x, nextPos.y)) continue;
      if (grid.isBlocked(nextPos.x, nextPos.y)) continue;

      const nextPipe = grid.getPipeAt(nextPos.x, nextPos.y);
      if (!nextPipe || !nextPipe.accepts(state.exitDir.opposite)) continue;

      // Enqueue next pipe.
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