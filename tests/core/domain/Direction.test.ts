import { describe, it, expect } from "vitest";
import { Direction } from "../../../src/core/domain/Direction";


describe('Direction', () => {
  describe('static instances', () => {
    it('should have all four cardinal directions', () => {
      expect(Direction.Up).toBeDefined();
      expect(Direction.Down).toBeDefined();
      expect(Direction.Left).toBeDefined();
      expect(Direction.Right).toBeDefined();
    });

    it('should have correct angles', () => {
      expect(Direction.Up.angle).toBe(270);
      expect(Direction.Right.angle).toBe(0);
      expect(Direction.Down.angle).toBe(90);
      expect(Direction.Left.angle).toBe(180);
    });

    it('should have correct deltas', () => {
      expect(Direction.Up.dx).toBe(0);
      expect(Direction.Up.dy).toBe(-1);
      expect(Direction.Right.dx).toBe(1);
      expect(Direction.Right.dy).toBe(0);
      expect(Direction.Down.dx).toBe(0);
      expect(Direction.Down.dy).toBe(1);
      expect(Direction.Left.dx).toBe(-1);
      expect(Direction.Left.dy).toBe(0);
    });
  });

  describe('opposite', () => {
    it('should return correct opposite directions', () => {
      expect(Direction.Up.opposite).toBe(Direction.Down);
      expect(Direction.Down.opposite).toBe(Direction.Up);
      expect(Direction.Left.opposite).toBe(Direction.Right);
      expect(Direction.Right.opposite).toBe(Direction.Left);
    });

    it('opposite of opposite should be original', () => {
      Direction.All.forEach(dir => {
        expect(dir.opposite.opposite).toBe(dir);
      });
    });
  });

  describe('fromAngle', () => {
    it('should return correct direction for valid angles', () => {
      expect(Direction.fromAngle(0)).toBe(Direction.Right);
      expect(Direction.fromAngle(90)).toBe(Direction.Down);
      expect(Direction.fromAngle(180)).toBe(Direction.Left);
      expect(Direction.fromAngle(270)).toBe(Direction.Up);
    });

    it('should handle angle normalization', () => {
      expect(Direction.fromAngle(360)).toBe(Direction.Right);
      expect(Direction.fromAngle(450)).toBe(Direction.Down);
      expect(Direction.fromAngle(-90)).toBe(Direction.Up);
    });

    it('should throw for invalid angles', () => {
      expect(() => Direction.fromAngle(45)).toThrow();
      expect(() => Direction.fromAngle(135)).toThrow();
    });
  });

  describe('All', () => {
    it('should contain exactly 4 directions', () => {
      expect(Direction.All).toHaveLength(4);
    });

    it('should contain all cardinal directions', () => {
      expect(Direction.All).toContain(Direction.Up);
      expect(Direction.All).toContain(Direction.Down);
      expect(Direction.All).toContain(Direction.Left);
      expect(Direction.All).toContain(Direction.Right);
    });
  });
});