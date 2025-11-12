import type { ILogger } from "../../logging/ILogger";
import type { Direction } from "../Direction";
import type { Grid } from "../grid/Grid";
import type { Pipe } from "../pipe/Pipe";


interface ActivePipeState {
  pipe: Pipe;
  entryDir: Direction | null;
  exitDir: Direction | null;
  progress: number;       // 0–100
  delayRemaining: number; // seconds
}

export interface IFlowNetwork {
  initialize(startDelaySeconds?: number): void;
  update(delta: number, speed: number): void;
  getActiveState(): ActivePipeState | undefined;
  getVisitedPortsSnapshot(): Array<{ pipe: Pipe; dirs: Direction[] }>;
}

/** Central flow network */
export class FlowNetwork implements IFlowNetwork {
  private activeStates: ActivePipeState[] = [];
  private visitedPorts = new Map<Pipe, Set<Direction>>();

  constructor(
    private readonly grid: Grid,
    private readonly logger: ILogger
  ) {}

  initialize(startDelaySeconds = 0): void {
    const startPipe = this.grid.startPipe;
    if (!startPipe) return;

    this.activeStates = [{
      pipe: startPipe,
      entryDir: null,
      exitDir: startPipe.openPorts[0],
      progress: 0,
      delayRemaining: startDelaySeconds,
    }];

    this.visitedPorts.clear();
    this.logger.info(`Flow initialized at ${startPipe.position} with delay ${startDelaySeconds}s`);
  }

  update(delta: number, speed: number) {
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
        state.exitDir = this.getNextExit(state.pipe, state.entryDir, memo);
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

      const nextPipe = state.pipe.getNeighbor(state.exitDir, this.grid);
      if (!nextPipe || !nextPipe.accepts(state.exitDir.opposite)) continue;

      newStates.push({
        pipe: nextPipe,
        entryDir: state.exitDir.opposite,
        exitDir: null,
        progress: 0,
        delayRemaining: 0,
      });

      this.logger.debug(`Flow advanced from ${state.pipe.position} to ${nextPipe.position}`);
    }

    this.activeStates = newStates;
  }

  private getNextExit(
    pipe: Pipe,
    entryDir: Direction,
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
      this.logger.debug(`Selected exit ${direction.name} from ${pipe.position} (longest path: ${length} steps)`);
      return direction;
    }

    return availablePorts[0];
  }

  private addVisited(pipe: Pipe, dir: Direction): void {
    if (!this.visitedPorts.has(pipe)) this.visitedPorts.set(pipe, new Set());
    this.visitedPorts.get(pipe)!.add(dir);
  }

  getActiveState(): ActivePipeState | undefined {
    return this.activeStates[0];
  }

  getVisitedPortsSnapshot(): Array<{ pipe: Pipe; dirs: Direction[] }> {
    return Array.from(this.visitedPorts.entries()).map(([pipe, dirs]) => ({
      pipe,
      dirs: Array.from(dirs),
    }));
  }

  private calculateLongestPath(
    pipe: Pipe,
    entryDir: Direction,
    visitedInPath: Set<Pipe>,
    memo: Map<string, { direction: Direction | null; length: number }>
  ): { direction: Direction | null; length: number } {
    const key = `${pipe.position.toString()},${entryDir.name}`;
    if (memo.has(key)) return memo.get(key)!;

    visitedInPath.add(pipe);

    let bestDirection: Direction | null = null;
    let maxLength = -1;

    const openPorts = pipe.openPorts.filter(d => d !== entryDir);

    for (const exitDir of openPorts) {
      const nextPipe = pipe.getNeighbor(exitDir, this.grid);
      if (!nextPipe || !nextPipe.accepts(exitDir.opposite)) continue;

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