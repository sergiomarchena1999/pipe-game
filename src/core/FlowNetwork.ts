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
  private static grid: Grid;

  static initialize(grid: Grid, logger: ILogger, startDelaySeconds = 0) {
    const startPipe = grid.startPipe;
    if (!startPipe) return;

    this.grid = grid;
    this.activeStates = [{
      pipe: startPipe,
      entryDir: null,
      exitDir: startPipe.openPorts[0],
      progress: 0,
      delayRemaining: startDelaySeconds,
    }];

    this.visitedPorts = new Map();
    logger.info(`Flow initialized at ${startPipe.position} with delay ${startDelaySeconds}s`);
  }

  static update(delta: number, speed: number, grid: Grid, logger: ILogger) {
    this.grid = grid;
    const newStates: ActivePipeState[] = [];

    // Shared memo for all active states during this update
    const memo = new Map<string, { direction: Direction | null; length: number }>();

    for (const state of this.activeStates) {
      if (state.delayRemaining > 0) {
        state.delayRemaining -= delta;
        newStates.push(state);
        continue;
      }

      if (state.entryDir && !state.exitDir) {
        state.pipe.markUsed(state.entryDir);
      }

      const prevProgress = state.progress;
      if (state.entryDir && prevProgress == 0) {
        state.exitDir = this.getNextExit(state.pipe, state.entryDir, logger, memo);
      }

      state.progress += speed * delta;

      if (state.entryDir && prevProgress < 50 && state.progress >= 50) {
        this.addVisited(state.pipe, state.entryDir);
      }

      if (state.progress < 100) {
        newStates.push(state);
        continue;
      }

      if (prevProgress < 100 && state.progress >= 100 && state.exitDir) {
        this.addVisited(state.pipe, state.exitDir);
        state.pipe.markUsed(state.exitDir);
      }

      if (!state.exitDir) continue;

      const nextPos = {
        x: state.pipe.position.x + state.exitDir.dx,
        y: state.pipe.position.y + state.exitDir.dy,
      };

      const cell = grid.tryGetCell(nextPos.x, nextPos.y);
      if (!cell || cell.blocked) continue;

      const nextPipe = cell.pipe;
      if (!nextPipe || !nextPipe.accepts(state.exitDir.opposite)) continue;

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

  private static getNextExit(
    pipe: Pipe,
    entryDir: Direction,
    logger: ILogger,
    memo: Map<string, { direction: Direction | null; length: number }>
  ): Direction | null {
    const openPorts = pipe.openPorts.filter(d => d !== entryDir);
    if (openPorts.length === 0) return null;

    const visited = this.visitedPorts.get(pipe);
    const availablePorts = openPorts.filter(d => !visited?.has(d));
    if (availablePorts.length === 1) return availablePorts[0];
    if (availablePorts.length === 0) return null;

    const { direction, length } = this.calculateLongestPath(pipe, entryDir, new Set(), memo);
    if (direction) {
      logger.debug(`Selected exit ${direction.name} from ${pipe.position} (longest path: ${length} steps)`);
      return direction;
    }

    return availablePorts[0];
  }

  private static addVisited(pipe: Pipe, dir: Direction) {
    if (!this.visitedPorts.has(pipe)) this.visitedPorts.set(pipe, new Set());
    this.visitedPorts.get(pipe)!.add(dir);
  }

  static getActiveState(): ActivePipeState | undefined {
    return this.activeStates[0];
  }

  static getVisitedPortsSnapshot(): Array<{ pipe: Pipe; dirs: Direction[] }> {
    const out: Array<{ pipe: Pipe; dirs: Direction[] }> = [];
    for (const [pipe, set] of this.visitedPorts.entries()) {
      out.push({ pipe, dirs: Array.from(set) });
    }
    return out;
  }

  private static calculateLongestPath(
    pipe: Pipe,
    entryDir: Direction,
    visitedInPath: Set<Pipe> = new Set(),
    memo: Map<string, { direction: Direction | null; length: number }>
  ): { direction: Direction | null; length: number } {
    const key = `${pipe.position},${entryDir.name}`;
    if (memo.has(key)) return memo.get(key)!;

    visitedInPath.add(pipe);

    let bestDirection: Direction | null = null;
    let maxLength = -1;

    const openPorts = pipe.openPorts.filter(d => d !== entryDir);

    for (const exitDir of openPorts) {
      const nextPos = { x: pipe.position.x + exitDir.dx, y: pipe.position.y + exitDir.dy };
      const cell = this.grid.tryGetCell(nextPos.x, nextPos.y);
      if (!cell || cell.blocked || !cell.pipe || !cell.pipe.accepts(exitDir.opposite)) continue;

      const nextPipe = cell.pipe;
      if (visitedInPath.has(nextPipe)) continue;

      const subVisited = new Set(visitedInPath);
      const { length: downstreamLength } = this.calculateLongestPath(nextPipe, exitDir.opposite, subVisited, memo);

      if (1 + downstreamLength > maxLength) {
        maxLength = 1 + downstreamLength;
        bestDirection = exitDir;
      }
    }

    const result = { direction: bestDirection, length: Math.max(0, maxLength) };
    memo.set(key, result);
    return result;
  }
}