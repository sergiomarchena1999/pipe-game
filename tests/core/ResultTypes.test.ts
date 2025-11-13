import { describe, expect, it } from "vitest";
import { Result } from "../../src/core/ResultTypes";


describe('Result Type', () => {
  describe('ok', () => {
    it('should create success result', () => {
      const result = Result.ok(42);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
      }
    });

    it('should work with complex types', () => {
      const obj = { name: 'test', value: 123 };
      const result = Result.ok(obj);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(obj);
      }
    });
  });

  describe('fail', () => {
    it('should create failure result', () => {
      const result = Result.fail('error_code');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('error_code');
      }
    });

    it('should work with typed errors', () => {
      type MyError = 'not_found' | 'unauthorized';
      const result: Result<never, MyError> = Result.fail('not_found');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('not_found');
      }
    });
  });

  describe('map', () => {
    it('should transform success value', () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, x => x * 2);
      
      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should preserve failure', () => {
      const result = Result.fail('error');
      const mapped = Result.map(result, x => x * 2);
      
      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe('error');
      }
    });

    it('should handle type transformations', () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, x => `value: ${x}`);
      
      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe('value: 5');
      }
    });
  });

  describe('flatMap', () => {
    it('should chain success results', () => {
      const result = Result.ok(5);
      const chained = Result.flatMap(result, x => Result.ok(x * 2));
      
      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.value).toBe(10);
      }
    });

    it('should short-circuit on first failure', () => {
      const result = Result.ok(5);
      const chained = Result.flatMap(result, _ => Result.fail('error'));
      
      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe('error');
      }
    });

    it('should preserve original failure', () => {
      const result = Result.fail('first_error');
      const chained = Result.flatMap(result, x => Result.ok(x * 2));
      
      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe('first_error');
      }
    });

    it('should handle complex chains', () => {
      const divide = (x: number, y: number): Result<number, 'division_by_zero'> => {
        return y === 0 ? Result.fail('division_by_zero') : Result.ok(x / y);
      };
      
      const result = Result.ok(10);
      const chained = Result.flatMap(result, x => divide(x, 2));
      
      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.value).toBe(5);
      }
      
      const failedChain = Result.flatMap(result, x => divide(x, 0));
      expect(failedChain.success).toBe(false);
    });
  });
});