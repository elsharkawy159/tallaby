import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDLE_TIMEOUT_MS, runWhenIdleAfterLoad, type IdleWindow } from './run-when-idle.client'

/** A fake window: `load` listeners, optional requestIdleCallback, timers from vitest. */
function fakeWindow ({ readyState = 'loading', idle = true } = {}) {
  const listeners = new Set<() => void>()
  const idleQueue = new Map<number, () => void>()
  let nextIdle = 1
  const win: IdleWindow & { fireLoad(): void; fireIdle(): void; listeners: Set<() => void> } = {
    document: { readyState },
    listeners,
    addEventListener: (_type, listener) => { listeners.add(listener) },
    removeEventListener: (_type, listener) => { listeners.delete(listener) },
    setTimeout: (cb, ms) => setTimeout(cb, ms) as unknown as number,
    clearTimeout: (handle) => clearTimeout(handle),
    fireLoad () {
      win.document.readyState = 'complete'
      for (const listener of [...listeners]) listener()
    },
    fireIdle () {
      const queued = [...idleQueue.values()]
      idleQueue.clear()
      for (const cb of queued) cb()
    },
  }
  if (idle) {
    win.requestIdleCallback = (cb, options) => {
      expect(options).toEqual({ timeout: IDLE_TIMEOUT_MS })
      const handle = nextIdle++
      idleQueue.set(handle, cb)
      return handle
    }
    win.cancelIdleCallback = (handle) => { idleQueue.delete(handle) }
  }
  return win
}

describe('runWhenIdleAfterLoad', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('waits for load, then for idle', () => {
    const win = fakeWindow()
    const cb = vi.fn()
    runWhenIdleAfterLoad(cb, win)
    win.fireIdle()
    vi.runAllTimers()
    expect(cb).not.toHaveBeenCalled()
    win.fireLoad()
    expect(cb).not.toHaveBeenCalled()
    win.fireIdle()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(win.listeners.size).toBe(0)
  })

  it('only waits for idle when the page has already loaded', () => {
    const win = fakeWindow({ readyState: 'complete' })
    const cb = vi.fn()
    runWhenIdleAfterLoad(cb, win)
    expect(cb).not.toHaveBeenCalled()
    win.fireIdle()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('falls back to a timeout without requestIdleCallback', () => {
    const win = fakeWindow({ idle: false })
    const cb = vi.fn()
    runWhenIdleAfterLoad(cb, win)
    vi.runAllTimers()
    expect(cb).not.toHaveBeenCalled()
    win.fireLoad()
    expect(cb).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('never runs once cancelled, before or after load', () => {
    const before = fakeWindow()
    const cbBefore = vi.fn()
    runWhenIdleAfterLoad(cbBefore, before)()
    expect(before.listeners.size).toBe(0)
    before.fireLoad()
    before.fireIdle()

    const after = fakeWindow()
    const cbAfter = vi.fn()
    const cancel = runWhenIdleAfterLoad(cbAfter, after)
    after.fireLoad()
    cancel()
    after.fireIdle()

    const noIdle = fakeWindow({ idle: false, readyState: 'complete' })
    const cbNoIdle = vi.fn()
    runWhenIdleAfterLoad(cbNoIdle, noIdle)()
    vi.runAllTimers()

    expect(cbBefore).not.toHaveBeenCalled()
    expect(cbAfter).not.toHaveBeenCalled()
    expect(cbNoIdle).not.toHaveBeenCalled()
  })

  it('runs once, and cancelling afterwards is harmless', () => {
    const win = fakeWindow({ readyState: 'complete' })
    const cb = vi.fn()
    const cancel = runWhenIdleAfterLoad(cb, win)
    win.fireIdle()
    cancel()
    win.fireIdle()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('is a no-op without a window (SSR)', () => {
    const cb = vi.fn()
    expect(() => runWhenIdleAfterLoad(cb, null)()).not.toThrow()
    expect(cb).not.toHaveBeenCalled()
  })
})
