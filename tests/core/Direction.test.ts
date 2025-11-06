import { describe, it, expect } from "vitest";
import { Direction } from "../../src/core/Direction";


describe("Direction", () => {
  it("should have four static directions", () => {
    expect(Direction.All).toHaveLength(4);
    expect(Direction.All).toContain(Direction.Up);
    expect(Direction.All).toContain(Direction.Down);
  });

  it("should compute correct opposites", () => {
    expect(Direction.Up.opposite).toBe(Direction.Down);
    expect(Direction.Left.opposite).toBe(Direction.Right);
  });

  it("should rotate 90 degrees correctly", () => {
    expect(Direction.Up.rotate90()).toBe(Direction.Right);
    expect(Direction.Up.rotate90(2)).toBe(Direction.Down);
    expect(Direction.Right.rotate90(3)).toBe(Direction.Up);
  });

  it("should wrap rotation beyond 360°", () => {
    expect(Direction.Left.rotate90(4)).toBe(Direction.Left);
    expect(Direction.Up.rotate90(5)).toBe(Direction.Right);
  });

  it("should have correct angles", () => {
    expect(Direction.Right.angle).toBe(0);
    expect(Direction.Down.angle).toBe(90);
    expect(Direction.Left.angle).toBe(180);
    expect(Direction.Up.angle).toBe(270);
  });

  it("should offset coordinates correctly", () => {
    const { x, y } = Direction.Up.offset(2, 2);
    expect(x).toBe(2);
    expect(y).toBe(1);
  });

  it("toString() should return direction name", () => {
    expect(Direction.Right.toString()).toBe("right");
  });
});