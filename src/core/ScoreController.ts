import type { ILogger } from "./logging/ILogger";
import type { Grid } from "./Grid";
import type { Pipe } from "./Pipe";


/** Tracks the number of pipes successfully connected to the start. */
export class ScoreController {
  private score = 0;
  private readonly visited: boolean[][];

  constructor(width: number, private readonly height: number, private readonly grid: Grid, private readonly logger: ILogger) {
    this.visited = Array.from({ length: height }, () => Array(width).fill(false));
  }

  /** Updates the score by counting all pipes connected to the start pipe. */
  updateScore(): void {
    const start = this.grid.startPipe;
    if (!start) {
      this.score = 0;
      return;
    }

    const count = this.countConnectedPipes(start);
    if (count !== this.score) {
      this.logger.info(`Score updated: ${count} connected pipes`);
      this.score = count;
    }
  }

  /** Returns the current score. */
  getScore(): number {
    return this.score;
  }

  /** Iterative flood-fill to count connected pipes. */
  private countConnectedPipes(start: Pipe): number {
    // Clear visited matrix
    for (let y = 0; y < this.height; y++) {
      this.visited[y].fill(false);
    }

    let count = 0;
    const stack: Pipe[] = [start];

    while (stack.length > 0) {
      const pipe = stack.pop()!;
      const { x, y } = pipe.position;

      if (this.visited[y][x]) continue;
      this.visited[y][x] = true;
      count++;

      // use shared helper
      const connectedNeighbors = this.grid.getConnectedNeighbors(pipe);
      for (const neighbor of connectedNeighbors) {
        const { x: nx, y: ny } = neighbor.position;
        if (!this.visited[ny][nx]) {
          stack.push(neighbor);
        }
      }
    }

    return count;
  }

  /** Resets the score. */
  reset(): void {
    this.score = 0;
    this.logger.info("Score reset to 0");
  }
}