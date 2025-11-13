import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from "../../../src/core/logging/Logger";


describe('Logger', () => {
  let consoleSpy: {
    log: any;
    info: any;
    warn: any;
    error: any;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      const logger = new Logger('TestLogger');
      logger.debug('test message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('TestLogger'),
        expect.any(String)
      );
    });

    it('should log info messages', () => {
      const logger = new Logger('TestLogger');
      logger.info('test message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('TestLogger'),
        expect.any(String)
      );
    });

    it('should log warnings', () => {
      const logger = new Logger('TestLogger');
      logger.warn('test warning');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('TestLogger'),
        expect.any(String)
      );
    });

    it('should log errors', () => {
      const logger = new Logger('TestLogger');
      logger.error('test error');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('TestLogger'),
        expect.any(String),
        ''
      );
    });

    it('should include error object when provided', () => {
      const logger = new Logger('TestLogger');
      const error = new Error('test error');
      logger.error('message', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('TestLogger'),
        expect.any(String),
        error
      );
    });
  });

  describe('context', () => {
    it('should include context in log messages', () => {
      const logger = new Logger('MyContext');
      logger.info('test');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[MyContext]'),
        expect.any(String)
      );
    });

    it('should support different contexts', () => {
      const logger1 = new Logger('Context1');
      const logger2 = new Logger('Context2');
      
      logger1.info('message 1');
      logger2.info('message 2');
      
      expect(consoleSpy.info).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[Context1]'),
        expect.any(String)
      );
      expect(consoleSpy.info).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('[Context2]'),
        expect.any(String)
      );
    });
  });
});