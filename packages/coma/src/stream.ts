export type Field = {
  key: string
  value: string
}

/**
 * Streams CSV data line by line.
 * Uses a buffer to store incomplete lines between chunks.
 */
export function LineStream(headers: string[]) {
  let buffer = ""

  /**
   * Processes a chunk of CSV text and returns complete rows found so far.
   */
  return function streamChunk(chunk = "") {
    buffer += chunk

    // Split by newline to find complete lines
    const lines = buffer.split("\n")
    // The last element is either an empty string or an incomplete line, so we buffer it
    buffer = lines.pop() || ""

    const headerLength = headers.length
    return lines
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed) return null

        const parts = trimmed.split(",")
        if (parts.length < headerLength) return null

        // Convert row to an array of Field objects
        return parts.map((part, index) => ({
          key: headers[index],
          value: part
        }))
      })
      .filter(Boolean) as Field[][]
  }
}

/**
 * Streams CSV data field by field.
 * Highly granular processing that splits on commas and newlines.
 */
export function FieldStream(headers: string[]) {
  let buffer = ""
  let lastLen = 0

  return function streamChunk(chunk = "") {
    buffer += chunk

    // Process complete fields (split by comma or newline)
    const fields = buffer.split(/,|\n/)
    // Buffer the last fragment which might be incomplete
    buffer = fields.pop() || ""

    const headerLength = headers.length
    return fields.reduce((acc, field) => {
      const data = {
        key: headers[lastLen],
        value: field
      }

      // Determine if we should start a new row or append to the current one
      if (lastLen === 0 || acc.length === 0) {
        const curr: Field[] = []
        acc.push(curr)
        curr.push(data)
      } else {
        const curr = acc[acc.length - 1]
        curr.push(data)
      }

      // Update position in the header sequence
      lastLen = (lastLen + 1) % headerLength

      return acc
    }, [] as Field[][])
  }
}
