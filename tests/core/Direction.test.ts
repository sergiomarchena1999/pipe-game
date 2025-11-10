import { describe, it, expect } from "vitest";
import { Direction } from "../../src/core/Direction";


describe("Direction", () => {
  it("should have four static directions", () => {
    expect(Direction.All).toHaveLength(4);
    expect(Direction.All).toContain(Direction.Up);
    expect(Direction.All).toContain(Direction.Down);
    expect(Direction.All).toContain(Direction.Left);
    expect(Direction.All).toContain(Direction.Right);
  });

  it("should compute correct opposites", () => {
    expect(Direction.Up.opposite).toBe(Direction.Down);
    expect(Direction.Down.opposite).toBe(Direction.Up);
    expect(Direction.Left.opposite).toBe(Direction.Right);
    expect(Direction.Right.opposite).toBe(Direction.Left);
  });

  it("should rotate 90 degrees correctly", () => {
    expect(Direction.Up.rotate90()).toBe(Direction.Right);
    expect(Direction.Up.rotate90(2)).toBe(Direction.Down);
    expect(Direction.Right.rotate90(3)).toBe(Direction.Up);
    expect(Direction.Left.rotate90(4)).toBe(Direction.Left);
    expect(Direction.Up.rotate90(5)).toBe(Direction.Right);
    expect(Direction.Down.rotate90(-1)).toBe(Direction.Right);
  });

  it("should have correct angles", () => {
    expect(Direction.Right.angle).toBe(0);
    expect(Direction.Down.angle).toBe(90);
    expect(Direction.Left.angle).toBe(180);
    expect(Direction.Up.angle).toBe(270);
  });

  it("should return correct direction from angle", () => {
    expect(Direction.fromAngle(0)).toBe(Direction.Right);
    expect(Direction.fromAngle(90)).toBe(Direction.Down);
    expect(Direction.fromAngle(180)).toBe(Direction.Left);
    expect(Direction.fromAngle(270)).toBe(Direction.Up);
    expect(Direction.fromAngle(360)).toBe(Direction.Right); // normalized
    expect(Direction.fromAngle(-90)).toBe(Direction.Up);  // normalized negative
  });

  it("fromAngle should throw on invalid angle", () => {
    expect(() => Direction.fromAngle(45)).toThrow();
    expect(() => Direction.fromAngle(123)).toThrow();
  });

  it("should offset coordinates correctly", () => {
    const tests = [
      { dir: Direction.Up, x: 2, y: 2, expected: { x: 2, y: 1 } },
      { dir: Direction.Right, x: 2, y: 2, expected: { x: 3, y: 2 } },
      { dir: Direction.Down, x: 2, y: 2, expected: { x: 2, y: 3 } },
      { dir: Direction.Left, x: 2, y: 2, expected: { x: 1, y: 2 } },
    ];

    tests.forEach(t => {
      expect(t.dir.offset(t.x, t.y)).toEqual(t.expected);
    });
  });

  it("toString() should return direction name", () => {
    expect(Direction.Right.toString()).toBe("right");
    expect(Direction.Left.toString()).toBe("left");
    expect(Direction.Up.toString()).toBe("up");
    expect(Direction.Down.toString()).toBe("down");
  });
});