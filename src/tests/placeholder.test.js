import { describe, it, expect } from 'vitest'

describe('Frontend test setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should support jsdom environment', () => {
    const div = document.createElement('div')
    div.textContent = 'GourmetGo'
    expect(div.textContent).toBe('GourmetGo')
  })
})
