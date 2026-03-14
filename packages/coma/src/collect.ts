import { type Field } from "./stream"

/**
 * Collects new fields into an existing array of objects.
 * Useful for building structured data from a stream of fields.
 *
 * It uses a "key-collision" heuristic: if a field key already exists
 * in the current tail object, it assumes a new row has started and
 * creates a new object in the array.
 *
 * @param currentItems - The existing array of objects (state).
 * @param newFields - The new fields returned by a Streamer (e.g., LineStream or FieldStream).
 * @returns A new array containing the updated data.
 */
export function collect<T extends Record<string, string>>(
  currentItems: T[],
  newFields: Field[][]
): T[] {
  if (newFields.length === 0) return currentItems

  // Shallow clone the array to keep it functional/immutable friendly
  const updated = [...currentItems]

  newFields.forEach((rowFields) => {
    rowFields.forEach((f) => {
      if (updated.length === 0) {
        updated.push({} as T)
      }

      let lastObj = updated[updated.length - 1]

      // If the current object already has this field, it means we are on a new row.
      if (lastObj[f.key as keyof T] !== undefined) {
        lastObj = {} as T
        updated.push(lastObj)
      }

      ;(lastObj as Record<string, string>)[f.key] = f.value
    })
  })

  return updated
}
