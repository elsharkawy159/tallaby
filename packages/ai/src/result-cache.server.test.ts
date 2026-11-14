import { beforeEach, describe, expect, it } from "vitest"
import { clearResultCache, createResultCache, readCachedResult, resultCacheKey, writeCachedResult } from "./result-cache.server"

describe("result cache", () => {
  beforeEach(() => clearResultCache())

  it("keys on every part and its boundaries", () => {
    expect(resultCacheKey(["ab", "c"])).not.toBe(resultCacheKey(["a", "bc"]))
    expect(resultCacheKey(["a", new Uint8Array([1, 2])])).toBe(resultCacheKey(["a", new Uint8Array([1, 2])]))
    expect(resultCacheKey(["a", new Uint8Array([1, 2])])).not.toBe(resultCacheKey(["a", new Uint8Array([1, 3])]))
  })

  it("expires entries after the TTL", () => {
    writeCachedResult("k", { title: "x" }, 1000, 0)
    expect(readCachedResult("k", 999)).toEqual({ title: "x" })
    expect(readCachedResult("k", 1000)).toBeUndefined()
  })

  it("keeps at most 200 entries, dropping the oldest", () => {
    for (let i = 0; i < 201; i++) writeCachedResult(`k${i}`, i, 60_000, 0)
    expect(readCachedResult("k0", 1)).toBeUndefined()
    expect(readCachedResult("k200", 1)).toBe(200)
  })
})

describe("createResultCache", () => {
  it("is separate from the shared cache and keeps its own limit", () => {
    const own = createResultCache(2)
    own.write("a", 1, 60_000, 0)
    own.write("b", 2, 60_000, 0)
    own.write("c", 3, 60_000, 0)
    expect(own.read("a", 1)).toBeUndefined()
    expect(own.read("c", 1)).toBe(3)
    expect(readCachedResult("c", 1)).toBeUndefined()
    expect(own.read("c", 60_000)).toBeUndefined()
  })
})
