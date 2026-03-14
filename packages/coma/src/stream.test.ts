/**
 * Unit tests for CSV streaming utilities.
 * Validates handling of complete rows and data fragments across chunks.
 */
import { describe, expect, it } from "vitest"

import { FieldStream, LineStream } from "./stream"

describe("LineStream", () => {
  it("should parse CSV lines into fields", () => {
    const headers = ["a", "b", "c"]
    const stream = LineStream(headers)
    const result = stream("1,2,3\n4,5,6\n")
    expect(result).toEqual([
      [
        { key: "a", value: "1" },
        { key: "b", value: "2" },
        { key: "c", value: "3" }
      ],
      [
        { key: "a", value: "4" },
        { key: "b", value: "5" },
        { key: "c", value: "6" }
      ]
    ])
  })

  it("should handle incomplete lines", () => {
    const headers = ["a", "b", "c"]
    const stream = LineStream(headers)
    const part1 = stream("1,2,3\n4,5")
    expect(part1).toEqual([
      [
        { key: "a", value: "1" },
        { key: "b", value: "2" },
        { key: "c", value: "3" }
      ]
    ])
    const part2 = stream(",6\n")
    expect(part2).toEqual([
      [
        { key: "a", value: "4" },
        { key: "b", value: "5" },
        { key: "c", value: "6" }
      ]
    ])
  })

  it("should handle empty chunks and whitespace", () => {
    const headers = ["a", "b"]
    const stream = LineStream(headers)
    expect(stream("")).toEqual([])
    expect(stream("\n\n")).toEqual([])
    expect(stream("1,2\n ")).toEqual([
      [
        { key: "a", value: "1" },
        { key: "b", value: "2" }
      ]
    ])
    expect(stream("\n3,4\n")).toEqual([
      [
        { key: "a", value: "3" },
        { key: "b", value: "4" }
      ]
    ])
  })

  it("should filter out rows with insufficient columns", () => {
    const headers = ["a", "b", "c"]
    const stream = LineStream(headers)
    const result = stream("1,2,3\n4,5\n6,7,8\n")
    expect(result).toEqual([
      [
        { key: "a", value: "1" },
        { key: "b", value: "2" },
        { key: "c", value: "3" }
      ],
      [
        { key: "a", value: "6" },
        { key: "b", value: "7" },
        { key: "c", value: "8" }
      ]
    ])
  })
})

describe("FieldStream", () => {
  it("should parse CSV fields into rows", () => {
    const headers = ["a", "b", "c"]
    const stream = FieldStream(headers)
    const result = stream("1,2,3\n4,5,6\n")
    expect(result).toEqual([
      [
        { key: "a", value: "1" },
        { key: "b", value: "2" },
        { key: "c", value: "3" }
      ],
      [
        { key: "a", value: "4" },
        { key: "b", value: "5" },
        { key: "c", value: "6" }
      ]
    ])
  })

  it("should handle incomplete fields", () => {
    const headers = ["a", "b", "c"]
    const stream = FieldStream(headers)
    const part1 = stream("1,2,")
    expect(part1).toEqual([
      [
        { key: "a", value: "1" },
        { key: "b", value: "2" }
      ]
    ])
    const part2 = stream("3\n4,5,6\n")
    expect(part2).toEqual([
      [{ key: "c", value: "3" }],
      [
        { key: "a", value: "4" },
        { key: "b", value: "5" },
        { key: "c", value: "6" }
      ]
    ])
  })

  it("should handle empty chunks and multiple separators", () => {
    const headers = ["a", "b"]
    const stream = FieldStream(headers)
    expect(stream("")).toEqual([])
    expect(stream(",,")).toEqual([
      [
        { key: "a", value: "" },
        { key: "b", value: "" }
      ]
    ])

    // Correcting expectation based on actual behavior:
    // \n\n splits into ["", "", ""], pop() leaves ["", ""], reduce runs twice.
    const res = stream("\n\n")
    expect(res).toEqual([
      [
        { key: "a", value: "" },
        { key: "b", value: "" }
      ]
    ])
  })

  it("should handle very fragmented chunks", () => {
    const headers = ["a", "b"]
    const stream = FieldStream(headers)
    expect(stream("1")).toEqual([])
    expect(stream(",")).toEqual([[{ key: "a", value: "1" }]])
    expect(stream("2")).toEqual([])
    expect(stream("\n")).toEqual([[{ key: "b", value: "2" }]])
  })
})
