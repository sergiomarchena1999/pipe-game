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

/** Cache key for path calculation memoization. */
type PathCacheKey = string;

/** Cached path calculation result. */
interface PathResult {
  readonly direction: Direction | null;
  readonly length: number;
}

/**
 * Central flow network that simulates water flowing through pipes.
 * Handles path-finding, progress tracking, and port usage marking.
 */
export class FlowNetwork {
  private activeStates: ActivePipeState[] = [];
  private visitedPorts = new Map<Pipe, Set<Direction>>();
  private pathCache = new Map<PathCacheKey, PathResult>();

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
    this.pathCache.clear();
    this.logger.info(`Flow initialized at ${startPipe.position} with delay ${startDelaySeconds}s`);
  }

  /**
   * Updates water flow simulation.
   * @param delta Time elapsed in seconds
   * @param speed Progress units per second (e.g., 50 = 2 seconds to traverse a pipe)
   */
  update(delta: number, speed: number) {
    const newStates: ActivePipeState[] = [];
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
        state.exitDir = this.selectExitDirection(state.pipe, state.entryDir);
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
  private selectExitDirection(pipe: Pipe, entryDir: Direction): Direction | null {
    const openPorts = pipe.openPorts.filter(d => d !== entryDir);
    if (openPorts.length === 0) return null;

    // Get available (unvisited) ports
    const visited = this.visitedPorts.get(pipe);
    const availablePorts = openPorts.filter(d => !visited?.has(d));

    // If only one choice, take it
    if (availablePorts.length === 1) {
      return availablePorts[0];
    }

    // If no unvisited ports, flow ends
    if (availablePorts.length === 0) {
      return null;
    }

    // Use longest-path heuristic to choose best exit
    const { direction } = this.calculateLongestPath(pipe, entryDir, new Set());
    if (direction) {
      this.logger.debug(`Selected exit ${direction.name} from ${pipe.position} (longest path)`);
      return direction;
    }

    // Fallback to first available port
    return availablePorts[0];
  }

  /** Marks a port as visited (water has flowed through it). */
  private markVisited(pipe: Pipe, dir: Direction): void {
    if (!this.visitedPorts.has(pipe)) {
      this.visitedPorts.set(pipe, new Set());
    }
    this.visitedPorts.get(pipe)!.add(dir);
  }

  /**
   * Calculates the longest path from a pipe/direction combination.
   * Uses memoization to avoid recalculating the same paths.
   */
  private calculateLongestPath(pipe: Pipe, entryDir: Direction, visitedInPath: Set<Pipe>): PathResult {
    // Check cache first
    const cacheKey = this.createCacheKey(pipe, entryDir);
    const cached = this.pathCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Mark this pipe as visited in current path
    visitedInPath.add(pipe);

    let bestDirection: Direction | null = null;
    let maxLength = -1;

    const openPorts = pipe.openPorts.filter(d => d !== entryDir);

    for (const exitDir of openPorts) {
      const nextPipe = this.grid.getNeighborPipe(pipe.position, exitDir);
      // Skip if no neighbor or can't connect
      if (!nextPipe || !nextPipe.accepts(exitDir.opposite)) {
        continue;
      }

      // Skip if we'd create a cycle
      if (visitedInPath.has(nextPipe)) {
        continue;
      }

      // Recursively calculate downstream path length
      const subVisited = new Set(visitedInPath);
      const { length: downstreamLength } = this.calculateLongestPath(
        nextPipe,
        exitDir.opposite,
        subVisited
      );

      const totalLength = 1 + downstreamLength;
      if (totalLength > maxLength) {
        maxLength = totalLength;
        bestDirection = exitDir;
      }
    }

    // Cache and return result
    const result: PathResult = {
      direction: bestDirection,
      length: Math.max(0, maxLength),
    };

    this.pathCache.set(cacheKey, result);
    return result;
  }

  /** Creates a unique cache key for a pipe and entry direction. */
  private createCacheKey(pipe: Pipe, entryDir: Direction): PathCacheKey {
    return `${pipe.position.toString()},${entryDir.name}`;
  }

  /**
   * Invalidates cached paths that involve a specific pipe.
   * Call this when a pipe is placed or removed.
   */
  invalidatePathCache(affectedPipe: Pipe): void {
    const keysToDelete: PathCacheKey[] = [];
    for (const key of this.pathCache.keys()) {
      if (key.startsWith(affectedPipe.position.toString())) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.pathCache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug(
        `Invalidated ${keysToDelete.length} cache entries for ${affectedPipe.position}`
      );
    }
  }
}