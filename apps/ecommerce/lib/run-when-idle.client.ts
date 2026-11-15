/** The browser APIs the scheduler needs (injectable for tests). */
export type IdleWindow = {
  document: { readyState: string }
  addEventListener(type: 'load', listener: () => void): void
  removeEventListener(type: 'load', listener: () => void): void
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
  setTimeout(cb: () => void, ms: number): number
  clearTimeout(handle: number): void
}

/** Longest wait for an idle moment after `load`, so a busy page still runs it. */
export const IDLE_TIMEOUT_MS = 3000

/**
 * Runs `cb` once, after the window `load` event and then at the next idle
 * moment (or after `IDLE_TIMEOUT_MS` at the latest; a short timeout where
 * `requestIdleCallback` is missing, e.g. Safari). Used to keep third-party
 * tags off the first paint and hydration. Returns a cancel function that is
 * safe to call at any time, including after `cb` ran.
 */
export function runWhenIdleAfterLoad (
  cb: () => void,
  win: IdleWindow | null = typeof window === 'undefined' ? null : (window as unknown as IdleWindow)
): () => void {
  if (!win) return () => {}
  let cancelled = false
  let idleHandle: number | null = null
  let timeoutHandle: number | null = null

  const run = () => {
    if (cancelled) return
    cancelled = true
    cb()
  }

  const scheduleIdle = () => {
    if (cancelled) return
    if (typeof win.requestIdleCallback === 'function') {
      idleHandle = win.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
    } else {
      timeoutHandle = win.setTimeout(run, 1)
    }
  }

  const onLoad = () => {
    win.removeEventListener('load', onLoad)
    scheduleIdle()
  }

  if (win.document.readyState === 'complete') scheduleIdle()
  else win.addEventListener('load', onLoad)

  return () => {
    if (cancelled) return
    cancelled = true
    win.removeEventListener('load', onLoad)
    if (idleHandle !== null) win.cancelIdleCallback?.(idleHandle)
    if (timeoutHandle !== null) win.clearTimeout(timeoutHandle)
  }
}
