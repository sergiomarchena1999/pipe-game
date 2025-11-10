import { describe, it, expect, beforeEach } from "vitest";
import { PipeShapes } from "../../src/core/constants/PipeShapes";
import { Direction } from "../../src/core/Direction";
import { GridCell } from "../../src/core/GridCell";
import { Pipe } from "../../src/core/Pipe";


describe("Pipe", () => {
  let cell: GridCell;

  beforeEach(() => {
    cell = new GridCell(0, 0);
  });

  describe("Construction and ports", () => {
    it("should create ports based on rotated shape connections", () => {
      const pipe = new Pipe(cell, PipeShapes.corner, Direction.Down);

      // Original corner connections: [Up, Right], rotated 90° clockwise → [Right, Down]
      const openPorts = pipe.getOpenPorts();
      expect(openPorts).toContain(Direction.Right);
      expect(openPorts).toContain(Direction.Down);
      expect(openPorts.length).toBe(2);
    });

    it("should correctly accept directions", () => {
      const pipe = new Pipe(cell, PipeShapes.straight, Direction.Down);

      // Original straight connections: [Left, Right], rotated 90° clockwise → [Up, Down]
      expect(pipe.accepts(Direction.Up)).toBe(true);
      expect(pipe.accepts(Direction.Down)).toBe(true);
      expect(pipe.accepts(Direction.Left)).toBe(false);
      expect(pipe.accepts(Direction.Right)).toBe(false);
    });

    it("should have correct initial open ports", () => {
      const pipe = new Pipe(cell, PipeShapes.cross, Direction.Left);
      // cross connects all directions → all ports open
      for (const dir of Direction.All) {
        expect(pipe.hasOpenPort(dir)).toBe(true);
      }
    });
  });

  describe("Marking ports as used", () => {
    it("should mark a port as used and update open ports", () => {
      const pipe = new Pipe(cell, PipeShapes.straight, Direction.Down);
      const outDir = Direction.Down; // rotated connection
      expect(pipe.hasOpenPort(outDir)).toBe(true);

      pipe.markUsed(outDir);
      expect(pipe.hasOpenPort(outDir)).toBe(false);
      expect(pipe.getOpenPorts()).not.toContain(outDir);
    });

    it("should handle marking all ports used", () => {
      const pipe = new Pipe(cell, PipeShapes.cross, Direction.Up);
      pipe.getOpenPorts().forEach(dir => pipe.markUsed(dir));
      expect(pipe.getOpenPorts().length).toBe(0);
      for (const dir of Direction.All) {
        expect(pipe.hasOpenPort(dir)).toBe(false);
      }
    });
  });

  describe("Asset key", () => {
    it("should return correct asset key", () => {
      const pipe = new Pipe(cell, PipeShapes.corner, Direction.Up);
      expect(pipe.assetKey).toBe("pipe-corner");
    });
  });

  describe("toString()", () => {
    it("should include asset key, open ports, and position", () => {
      const pipe = new Pipe(cell, PipeShapes.straight, Direction.Up);
      const str = pipe.toString();
      expect(str).toContain("pipe-straight");
      for (const dir of pipe.getOpenPorts()) {
        expect(str).toContain(dir.toString());
      }
      expect(str).toContain("0,0");
    });

    it("should update string after using a port", () => {
      const pipe = new Pipe(cell, PipeShapes.straight, Direction.Up);
      const dir = pipe.getOpenPorts()[0];
      pipe.markUsed(dir);
      expect(pipe.toString()).not.toContain(dir.toString());
    });
  });

  describe("Flow simulation between pipes", () => {
    it("should simulate water flowing between two connected pipes", () => {
      const p1 = new Pipe(new GridCell(0, 0), PipeShapes.straight, Direction.Right);
      const p2 = new Pipe(new GridCell(1, 0), PipeShapes.straight, Direction.Left);

      // Find out which directions are open after rotation
      const outDir = p1.getOpenPorts().find(d => d === Direction.Down || d === Direction.Right);
      expect(outDir).toBeDefined();

      // Ensure second pipe accepts from the correct direction
      const inDir = outDir!.opposite;
      expect(p2.accepts(inDir)).toBe(true);

      // Simulate flow
      p1.markUsed(outDir!);
      p2.markUsed(inDir);
      expect(p1.hasOpenPort(outDir!)).toBe(false);
      expect(p2.hasOpenPort(inDir)).toBe(false);
    });

    it("should handle a mini L-shaped network", () => {
      const p1 = new Pipe(new GridCell(0, 0), PipeShapes.corner, Direction.Down); // Right+Down
      const p2 = new Pipe(new GridCell(1, 0), PipeShapes.straight, Direction.Down); // Up+Down
      const p3 = new Pipe(new GridCell(1, 1), PipeShapes.corner, Direction.Up); // Left+Up

      // Check ports for flow
      expect(p1.hasOpenPort(Direction.Right)).toBe(true);
      expect(p2.accepts(Direction.Up)).toBe(true);
      expect(p3.accepts(Direction.Left)).toBe(true);

      // Mark ports as used to simulate flow
      p1.markUsed(Direction.Right);
      p2.markUsed(Direction.Up);
      p2.markUsed(Direction.Down);
      p3.markUsed(Direction.Left);
      p3.markUsed(Direction.Up);

      // All ports used
      expect(p1.getOpenPorts().length).toBe(1); // Down is still open
      expect(p2.getOpenPorts().length).toBe(0);
      expect(p3.getOpenPorts().length).toBe(0);
    });
  });
});