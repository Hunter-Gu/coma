import { describe, expect, it } from "vitest"

import { collect } from "./collect"

describe("collect", () => {
  it("should start a new object when the array is empty", () => {
    const result = collect([], [[{ key: "id", value: "1" }]])
    expect(result).toEqual([{ id: "1" }])
  })

  it("should append to the last object if no key collision", () => {
    const initial = [{ id: "1" }]
    const result = collect(initial, [[{ key: "name", value: "Alice" }]])
    expect(result).toEqual([{ id: "1", name: "Alice" }])
  })

  it("should start a new object on key collision", () => {
    const initial = [{ id: "1", name: "Alice" }]
    const result = collect(initial, [[{ key: "id", value: "2" }]])
    expect(result).toEqual([{ id: "1", name: "Alice" }, { id: "2" }])
  })

  it("should handle multiple rows in a single call", () => {
    const result = collect(
      [],
      [
        [
          { key: "id", value: "1" },
          { key: "name", value: "Alice" }
        ],
        [
          { key: "id", value: "2" },
          { key: "name", value: "Bob" }
        ]
      ]
    )
    expect(result).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" }
    ])
  })

  it("should handle fragmented rows across multiple calls", () => {
    let items: Record<string, string>[] = []
    items = collect(items, [[{ key: "id", value: "1" }]])
    items = collect(items, [[{ key: "name", value: "Alice" }]])
    items = collect(items, [[{ key: "id", value: "2" }]])
    expect(items).toEqual([{ id: "1", name: "Alice" }, { id: "2" }])
  })

  it("should return the same array if no new fields are provided", () => {
    const initial = [{ id: "1" }]
    const result = collect(initial, [])
    expect(result).toBe(initial)
  })
})
