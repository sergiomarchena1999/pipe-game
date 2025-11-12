import type { ILogger } from "../../logging/ILogger";
import type { Direction } from "../Direction";
import type { Grid } from "../grid/Grid";
import type { Pipe } from "../pipe/Pipe";


/** Represents the state of water flowing through a single pipe. */
interface ActivePipeState {
  pipe: Pipe;
  entryDir: Direction | null;
  exitDir: Direction | null;
  progress: number;       // 0–100
  delayRemaining: number; // seconds
}

/**
 * Central flow network that simulates water flowing through pipes.
 * Handles path-finding, progress tracking, and port usage marking.
 */
export class FlowNetwork {
  private activeStates: ActivePipeState[] = [];
  private visitedPorts = new Map<Pipe, Set<Direction>>();

  constructor(
    private readonly grid: Grid,
    private readonly logger: ILogger
  ) {}

  // ============================================================================
  // Public API
  // ============================================================================

  /** Initializes water flow from the start pipe. */
  initialize(startDelaySeconds = 0): void {
    const startPipe = this.grid.tryGetStartPipe();
    if (!startPipe) {
      this.logger.warn("Cannot initialize flow: no start pipe");
      return;
    }
    // Start flow from first open port
    const firstPort = startPipe.openPorts[0];
    if (!firstPort) {
      this.logger.warn("Start pipe has no open ports");
      return;
    }

    this.activeStates = [{
      pipe: startPipe,
      entryDir: null,
      exitDir: firstPort,
      progress: 0,
      delayRemaining: startDelaySeconds,
    }];

    this.visitedPorts.clear();
    this.logger.info(`Flow initialized at ${startPipe.position} with delay ${startDelaySeconds}s`);
  }

  /**
   * Updates water flow simulation.
   * @param delta Time elapsed in seconds
   * @param speed Progress units per second (e.g., 50 = 2 seconds to traverse a pipe)
   */
  update(delta: number, speed: number) {
    const newStates: ActivePipeState[] = [];

    // Shared memo for all active states during this update
    const memo = new Map<string, { direction: Direction | null; length: number }>();

    for (const state of this.activeStates) {
      // Handle initial delay
      if (state.delayRemaining > 0) {
        state.delayRemaining -= delta;
        newStates.push(state);
        continue;
      }

      // Mark entry port as used when flow enters
      if (state.entryDir && !state.exitDir) {
        state.pipe.markPortUsed(state.entryDir);
      }

      // Determine exit direction when flow enters pipe
      const prevProgress = state.progress;
      if (state.entryDir && prevProgress == 0) {
        state.exitDir = this.getNextExit(state.pipe, state.entryDir, memo);
      }

      // Advance progress
      state.progress += speed * delta;

      // Mark entry port as visited when reaching pipe center
      if (state.entryDir && prevProgress < 50 && state.progress >= 50) {
        this.markVisited(state.pipe, state.entryDir);
      }

      // Keep flowing if not complete
      if (state.progress < 100) {
        newStates.push(state);
        continue;
      }

      // Mark exit port when flow completes pipe
      if (
        prevProgress < 100 &&
        state.progress >= 100 &&
        state.exitDir
      ) {
        this.markVisited(state.pipe, state.exitDir);
        state.pipe.markPortUsed(state.exitDir);
      }

      // Try to continue to next pipe
      if (!state.exitDir) continue;

      const nextPipe = this.grid.getNeighborPipe(
        state.pipe.position,
        state.exitDir
      );

      if (!nextPipe || !nextPipe.accepts(state.exitDir.opposite)) {
        continue;
      }

      // Flow continues to next pipe
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

  /** Gets the current active flow state (for rendering). */
  getActiveState(): ActivePipeState | undefined {
    return this.activeStates[0];
  }

  /** Gets a snapshot of all visited ports (for rendering). */
  getVisitedPortsSnapshot(): Array<{ pipe: Pipe; dirs: Direction[] }> {
    return Array.from(this.visitedPorts.entries()).map(([pipe, dirs]) => ({
      pipe,
      dirs: Array.from(dirs),
    }));
  }

  /** Clears all flow state and cache. */
  clear(): void {
    this.activeStates = [];
    this.visitedPorts.clear();
    this.logger.info("Flow network cleared");
  }

  // ============================================================================
  // Private Implementation
  // ============================================================================

  /**
   * Selects which exit port water should take from a pipe.
   * Uses longest-path heuristic with memoization.
   */
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

    // Fallback to first available port
    return availablePorts[0];
  }

  /** Marks a port as visited (water has flowed through it). */
  private markVisited(pipe: Pipe, dir: Direction): void {
    if (!this.visitedPorts.has(pipe)) this.visitedPorts.set(pipe, new Set());
    this.visitedPorts.get(pipe)!.add(dir);
  }

  /**
   * Calculates the longest path from a pipe/direction combination.
   * Uses memoization to avoid recalculating the same paths.
   */
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