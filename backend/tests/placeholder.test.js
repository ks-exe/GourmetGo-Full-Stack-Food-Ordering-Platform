import { describe, it, expect } from 'vitest';

describe('Backend test setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to Node.js APIs', () => {
    expect(typeof process.env).toBe('object');
  });
});
