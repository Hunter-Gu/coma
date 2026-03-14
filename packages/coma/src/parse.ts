/**
 * Parses CSV data line by line into an array of objects.
 * Every line is expected to match the header structure.
 */
export function LineParser<
  T extends string[] = string[],
  Item = { [K in T[number]]: string }
>(headers: T) {
  let data: Item[] = []

  /**
   * Internal parser function that appends new CSV data to the existing state.
   */
  return function parseCSV(csv: string) {
    const lines = csv.split("\n")
    const headerLength = headers.length

    const appendData = lines
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed) return null

        const parts = trimmed.split(",")
        // Filter out rows that don't satisfy the header length requirement
        if (parts.length < headerLength) return null

        // Map parts to header keys
        return parts.reduce(
          (acc, part, index) => ({
            ...acc,
            [headers[index]]: part
          }),
          {} as Item
        )
      })
      .filter(Boolean) as Item[]

    data = data.concat(appendData)
    return data
  }
}

/**
 * Parses CSV data field by field.
 * Useful for data that might arrive in a more granular stream where lines aren't guaranteed.
 */
export function FieldParser<
  T extends string[] = string[],
  Item = Partial<{ [K in T[number]]: string }>
>(headers: T) {
  let data: Item[] = []
  let lastLen = 0

  return function parseCSV(csv: string) {
    // Split by either comma or newline
    const fields = csv.split(/,|\n/)

    const headerLength = headers.length
    data = fields.reduce((acc, field) => {
      const curr = {
        ...(lastLen === 0 ? {} : acc.pop()),
        [headers[lastLen]]: field
      } as Item
      acc.push(curr)

      // Rotate through headers to build the objects
      lastLen = (lastLen + 1) % headerLength

      return acc
    }, data)

    return data
  }
}
