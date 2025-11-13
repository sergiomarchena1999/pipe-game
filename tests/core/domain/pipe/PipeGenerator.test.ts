import { describe, it, expect } from 'vitest';
import { PipeGenerator } from '../../../../src/core/domain/pipe/PipeGenerator';
import { PipeWeights } from '../../../../src/config/GameConfig';
import { PipeType } from '../../../../src/core/constants/PipeShapes';


describe('PipeGenerator', () => {
  describe('construction', () => {
    it('should create generator with valid weights', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: 10,
        [PipeType.Corner]: 10,
        [PipeType.Cross]: 5,
        [PipeType.Start]: 0,
      };
      expect(() => new PipeGenerator(weights)).not.toThrow();
    });

    it('should throw when total weight is zero', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: 0,
        [PipeType.Corner]: 0,
        [PipeType.Cross]: 0,
        [PipeType.Start]: 0,
      };
      expect(() => new PipeGenerator(weights)).toThrow(/greater than 0/);
    });

    it('should throw when total weight is negative', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: -5,
        [PipeType.Corner]: -5,
        [PipeType.Cross]: -5,
        [PipeType.Start]: 0,
      };
      expect(() => new PipeGenerator(weights)).toThrow(/greater than 0/);
    });
  });

  describe('generatePipe', () => {
    it('should generate pipe with shape and direction', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: 10,
        [PipeType.Corner]: 10,
        [PipeType.Cross]: 5,
        [PipeType.Start]: 0,
      };
      const generator = new PipeGenerator(weights);
      const pipe = generator.generatePipe();
      
      expect(pipe.shape).toBeDefined();
      expect(pipe.direction).toBeDefined();
    });

    it('should never generate start pipes when weight is 0', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: 10,
        [PipeType.Corner]: 10,
        [PipeType.Cross]: 5,
        [PipeType.Start]: 0,
      };
      const generator = new PipeGenerator(weights);
      
      for (let i = 0; i < 100; i++) {
        const pipe = generator.generatePipe();
        expect(pipe.shape.id).not.toBe(PipeType.Start);
      }
    });

    it('should respect weight distribution', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: 100, // Should dominate
        [PipeType.Corner]: 1,
        [PipeType.Cross]: 1,
        [PipeType.Start]: 0,
      };
      const generator = new PipeGenerator(weights);
      const counts = { straight: 0, corner: 0, cross: 0 };
      
      for (let i = 0; i < 1000; i++) {
        const pipe = generator.generatePipe();
        if (pipe.shape.id === PipeType.Straight) counts.straight++;
        if (pipe.shape.id === PipeType.Corner) counts.corner++;
        if (pipe.shape.id === PipeType.Cross) counts.cross++;
      }
      
      // Straight should be much more common
      expect(counts.straight).toBeGreaterThan(900);
      expect(counts.corner).toBeLessThan(50);
      expect(counts.cross).toBeLessThan(50);
    });

    it('should generate all four directions', () => {
      const weights: PipeWeights = {
        [PipeType.Straight]: 10,
        [PipeType.Corner]: 0,
        [PipeType.Cross]: 0,
        [PipeType.Start]: 0,
      };
      const generator = new PipeGenerator(weights);
      const directions = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const pipe = generator.generatePipe();
        directions.add(pipe.direction.name);
      }
      
      expect(directions.size).toBe(4);
    });
  });
});