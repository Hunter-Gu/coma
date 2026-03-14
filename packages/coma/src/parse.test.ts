import { describe, expect, it } from "vitest"

import { FieldParser, LineParser } from "./parse"

describe("LineParser", () => {
  it("should parse multiple lines into objects", () => {
    const headers = ["name", "age"]
    const parse = LineParser(headers)
    const result = parse("Alice,30\nBob,25")
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" }
    ])
  })

  it("should accumulate data across calls", () => {
    const headers = ["name", "age"]
    const parse = LineParser(headers)
    parse("Alice,30")
    const result = parse("Bob,25")
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" }
    ])
  })

  it("should filter out rows with insufficient columns", () => {
    const headers = ["name", "age", "city"]
    const parse = LineParser(headers)
    const result = parse("Alice,30,NY\nBob,25")
    expect(result).toEqual([{ name: "Alice", age: "30", city: "NY" }])
  })

  it("should handle empty lines and whitespace", () => {
    const headers = ["name", "age"]
    const parse = LineParser(headers)
    const result = parse("\n  \nAlice,30\n\n Bob,25 \n")
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" }
    ])
  })

  it("should return an empty array for empty input", () => {
    const headers = ["name", "age"]
    const parse = LineParser(headers)
    expect(parse("")).toEqual([])
    expect(parse("   ")).toEqual([])
  })
})

describe("FieldParser", () => {
  it("should parse fields into objects", () => {
    const headers = ["name", "age"]
    const parse = FieldParser(headers)
    const result = parse("Alice,30\nBob,25")
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" }
    ])
  })

  it("should handle partial objects and trailing separators", () => {
    const headers = ["name", "age"]
    const parse = FieldParser(headers)
    // FieldParser fills objects as fields arrive.
    // If input ends after "Bob", the second object only has the "name" field.
    const result = parse("Alice,30,Bob")
    expect(result).toEqual([{ name: "Alice", age: "30" }, { name: "Bob" }])
  })

  it("should accumulate objects across calls", () => {
    const headers = ["name", "age"]
    const parse = FieldParser(headers)
    parse("Alice,30")
    const result = parse("Bob,25")
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" }
    ])
  })
})
