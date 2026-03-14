import { collect, FieldStream } from "@neilguuu/coma"
import { getEncoding } from "js-tiktoken"
import { parse as partialParse } from "partial-json"
import React, { useEffect, useRef, useState } from "react"

const enc = getEncoding("cl100k_base")

// --- Types ---
interface Startup {
  id: string
  name: string
  industry: string
  description: string
  [key: string]: string
}

// --- Mock Data ---
const generateStartups = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Startup-${Math.random().toString(36).substring(7).toUpperCase()}`,
    industry: ["AI", "Crypto", "SaaS", "Fintech", "HealthTech"][
      Math.floor(Math.random() * 5)
    ],
    description: `A revolutionary platform disrupting the industry with cutting edge technology.`
  }))
}

const STARTUPS = generateStartups(50)
const HEADERS = ["id", "name", "industry", "description"]

// --- Compilers ---
const buildJSONString = (data: Startup[]) => JSON.stringify(data, null, 2)
const buildCSVString = (data: Startup[]) => {
  const rows = data.map((item) =>
    HEADERS.map((h) => (item as Record<string, string>)[h]).join(",")
  )
  // Ensure the simulated stream ends with a newline so the parser flushes the final value.
  return `${HEADERS.join(",")}\n${rows.join("\n")}\n`
}

export default function StreamComparison() {
  const [dataSize, setDataSize] = useState(20)
  const [isStreaming, setIsStreaming] = useState(false)

  // Native JSON State
  const [nativeJsonRaw, setNativeJsonRaw] = useState("")
  const [nativeJsonParsed, setNativeJsonParsed] = useState<Partial<Startup>[]>(
    []
  )
  const [nativeJsonTokens, setNativeJsonTokens] = useState(0)
  const [isNativeDone, setIsNativeDone] = useState(false)

  // Partial JSON State
  const [partialJsonRaw, setPartialJsonRaw] = useState("")
  const [partialJsonParsed, setPartialJsonParsed] = useState<
    Partial<Startup>[]
  >([])
  const [partialJsonTokens, setPartialJsonTokens] = useState(0)
  const [isPartialDone, setIsPartialDone] = useState(false)

  // Coma State
  const [comaRaw, setComaRaw] = useState("")
  const [comaParsed, setComaParsed] = useState<Partial<Startup>[]>([])
  const [comaTokens, setComaTokens] = useState(0)
  const [isComaDone, setIsComaDone] = useState(false)

  const streamRef = useRef<{
    nativeJson?: number
    partialJson?: number
    comaInterval?: number
  }>({})
  // We need to store the parser instance per stream session
  const csvParserRef = useRef<ReturnType<typeof FieldStream> | null>(null)

  const startStream = () => {
    setIsStreaming(true)

    setNativeJsonRaw("")
    setNativeJsonParsed([])
    setNativeJsonTokens(0)
    setIsNativeDone(false)

    setPartialJsonRaw("")
    setPartialJsonParsed([])
    setPartialJsonTokens(0)
    setIsPartialDone(false)

    setComaRaw("")
    setComaParsed([])
    setComaTokens(0)
    setIsComaDone(false)

    csvParserRef.current = FieldStream(HEADERS)

    const targetData = STARTUPS.slice(0, dataSize)
    const fullJSON = buildJSONString(targetData)
    const fullCSV = buildCSVString(targetData)

    const CHUNK_SIZE = 15 // characters per tick
    const DELAY_MS = 20

    let jsonCursor = 0
    let partialJsonCursor = 0
    let comaCursor = 0

    // Native JSON Streamer
    streamRef.current.nativeJson = window.setInterval(() => {
      if (jsonCursor >= fullJSON.length) {
        clearInterval(streamRef.current.nativeJson)
        setIsNativeDone(true)
        return
      }
      const chunk = fullJSON.slice(jsonCursor, jsonCursor + CHUNK_SIZE)
      jsonCursor += CHUNK_SIZE

      setNativeJsonRaw((prev) => {
        const next = prev + chunk
        setNativeJsonTokens(enc.encode(next).length)

        try {
          const parsed = JSON.parse(next)
          if (Array.isArray(parsed)) setNativeJsonParsed(parsed)
        } catch {
          // Normal JSON parse will fail until the very end
        }
        return next
      })
    }, DELAY_MS)

    // Partial JSON Streamer
    streamRef.current.partialJson = window.setInterval(() => {
      if (partialJsonCursor >= fullJSON.length) {
        clearInterval(streamRef.current.partialJson)
        setIsPartialDone(true)
        return
      }
      const chunk = fullJSON.slice(
        partialJsonCursor,
        partialJsonCursor + CHUNK_SIZE
      )
      partialJsonCursor += CHUNK_SIZE

      setPartialJsonRaw((prev) => {
        const next = prev + chunk
        setPartialJsonTokens(enc.encode(next).length)

        try {
          const parsed = partialParse(next)
          if (Array.isArray(parsed)) setPartialJsonParsed(parsed)
        } catch {
          // Even partial-json might throw on highly unstable boundaries
        }
        return next
      })
    }, DELAY_MS)

    // Coma Streamer
    streamRef.current.comaInterval = window.setInterval(() => {
      if (comaCursor >= fullCSV.length) {
        clearInterval(streamRef.current.comaInterval)
        setIsComaDone(true)
        setIsStreaming(false)
        return
      }
      const chunk = fullCSV.slice(comaCursor, comaCursor + CHUNK_SIZE)
      comaCursor += CHUNK_SIZE

      setComaRaw((prev) => {
        const next = prev + chunk
        setComaTokens(enc.encode(next).length) // Accurate GPT-4 token count
        return next
      })

      // Stream parse!
      if (csvParserRef.current) {
        const newFields = csvParserRef.current(chunk)

        setComaParsed((prev) => collect(prev, newFields))
      }
    }, DELAY_MS)
  }

  useEffect(() => {
    const currentStream = streamRef.current
    return () => {
      clearInterval(currentStream.nativeJson)
      clearInterval(currentStream.partialJson)
      clearInterval(currentStream.comaInterval)
    }
  }, [])

  const percentageSaved =
    comaTokens > 0 && nativeJsonTokens > 0
      ? Math.round(((nativeJsonTokens - comaTokens) / nativeJsonTokens) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-black/5 border border-black/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <label className="text-sm text-black/60 font-medium">
            Rows to generate: <span className="text-black">{dataSize}</span>
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={dataSize}
            onChange={(e) => setDataSize(Number(e.target.value))}
            className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
            disabled={isStreaming}
          />
        </div>
        <button
          onClick={startStream}
          disabled={isStreaming}
          className="bg-black hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap">
          {isStreaming ? "Simulating Stream..." : "Start Simulation"}
        </button>
      </div>

      {percentageSaved > 0 && !isStreaming && (
        <div className="border border-black/10 bg-black/5 text-black p-4 rounded-lg text-center font-mono text-sm">
          Coma used {percentageSaved}% fewer tokens (measured via cl100k_base)
          to stream the exact same data.
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Native JSON Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <h2 className="text-xl font-medium text-zinc-400 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-sm ${isNativeDone ? "bg-zinc-400" : "bg-zinc-200"}`}></span>
              Native JSON
            </h2>
            <div className="text-sm font-mono text-zinc-400">
              Tokens: <span className="text-zinc-600">{nativeJsonTokens}</span>
            </div>
          </div>

          <div className="grid grid-rows-2 gap-4 h-[600px]">
            <div
              className={`bg-white rounded-lg border transition-colors duration-500 overflow-hidden flex flex-col shadow-sm ${isNativeDone ? "border-zinc-300" : "border-black/5"}`}>
              <div className="bg-zinc-50 px-4 py-2 text-xs text-zinc-400 font-mono border-b border-black/5 flex justify-between">
                <span>RAW STREAM</span>
                {isNativeDone && <span className="text-zinc-400">Done</span>}
              </div>
              <pre className="p-4 overflow-y-auto text-[13px] text-zinc-500 font-mono whitespace-pre-wrap flex-1 break-all">
                {nativeJsonRaw || (
                  <span className="text-black/20 italic">
                    Waiting to stream...
                  </span>
                )}
              </pre>
            </div>

            <div
              className={`bg-white rounded-lg border transition-colors duration-500 flex flex-col overflow-hidden shadow-sm ${isNativeDone ? "border-zinc-200" : "border-black/5"}`}>
              <div className="bg-zinc-50 px-4 py-2 text-xs text-zinc-400 font-mono border-b border-black/5">
                RENDERED (NEEDS FULL PARSE)
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {nativeJsonParsed.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-300 text-sm font-mono text-center px-4">
                    {isStreaming
                      ? "Waiting for closing brackets `]` ..."
                      : "No data parsed."}
                  </div>
                ) : (
                  <Table data={nativeJsonParsed} type="native" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Partial JSON Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <h2 className="text-xl font-medium text-amber-600/60 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-sm ${isPartialDone ? "bg-amber-500" : "bg-amber-200"}`}></span>
              Partial JSON
            </h2>
            <div className="text-sm font-mono text-amber-600/40">
              Tokens:{" "}
              <span className="text-amber-700/70">{partialJsonTokens}</span>
            </div>
          </div>

          <div className="grid grid-rows-2 gap-4 h-[600px]">
            <div
              className={`bg-white rounded-lg border transition-colors duration-500 overflow-hidden flex flex-col shadow-sm ${isPartialDone ? "border-amber-200" : "border-black/5"}`}>
              <div className="bg-amber-50/30 px-4 py-2 text-xs text-amber-600/40 font-mono border-b border-amber-500/10 flex justify-between">
                <span>RAW STREAM</span>
                {isStreaming && !isPartialDone && (
                  <span className="text-amber-500/60 animate-pulse">
                    Computing AST...
                  </span>
                )}
                {isPartialDone && (
                  <span className="text-amber-500/60">Done</span>
                )}
              </div>
              <pre className="p-4 overflow-y-auto text-[13px] text-zinc-500 font-mono whitespace-pre-wrap flex-1 break-all">
                {partialJsonRaw || (
                  <span className="text-black/20 italic">
                    Waiting to stream...
                  </span>
                )}
              </pre>
            </div>

            <div
              className={`bg-white rounded-lg border transition-colors duration-500 flex flex-col overflow-hidden shadow-sm ${isPartialDone ? "border-amber-100" : "border-black/5"}`}>
              <div className="bg-amber-50/30 px-4 py-2 text-xs text-amber-600/40 font-mono border-b border-amber-500/10">
                RENDERED (VIA PARTIAL-JSON)
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {partialJsonParsed.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-amber-600/20 text-sm font-mono text-center px-4">
                    {isStreaming
                      ? "Waiting for structural hints..."
                      : "No data parsed."}
                  </div>
                ) : (
                  <Table data={partialJsonParsed} type="partial" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coma Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/20 pb-2">
            <h2 className="text-xl font-medium text-emerald-600 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-sm ${isComaDone ? "bg-emerald-500" : "bg-emerald-200 animate-pulse"}`}></span>
              Coma (CSV)
            </h2>
            <div className="text-sm font-mono text-emerald-600/60">
              Tokens:{" "}
              <span className="text-emerald-700 font-medium">{comaTokens}</span>
            </div>
          </div>

          <div className="grid grid-rows-2 gap-4 h-[600px]">
            <div
              className={`bg-white rounded-lg border transition-colors duration-500 overflow-hidden flex flex-col relative group shadow-sm ${isComaDone ? "border-emerald-300" : "border-black/10"}`}>
              <div className="bg-emerald-50/30 px-4 py-2 text-xs text-emerald-600/60 font-mono border-b border-emerald-500/10 flex justify-between">
                <span>RAW STREAM</span>
                {isStreaming && !isComaDone && (
                  <span className="text-emerald-500/60 animate-pulse">
                    Parsing real-time...
                  </span>
                )}
                {isComaDone && (
                  <span className="text-emerald-500/60">Done</span>
                )}
              </div>
              <pre className="p-4 overflow-y-auto text-[13px] text-black/80 font-mono whitespace-pre-wrap flex-1 relative z-10 break-all">
                {comaRaw || (
                  <span className="text-black/20 italic">
                    Waiting to stream...
                  </span>
                )}
              </pre>
            </div>

            <div
              className={`bg-white rounded-lg border transition-colors duration-500 flex flex-col overflow-hidden relative shadow-sm ${isComaDone ? "border-emerald-200" : "border-black/10"}`}>
              <div className="bg-emerald-50/30 px-4 py-2 text-xs text-emerald-600/60 font-mono border-b border-emerald-500/10">
                RENDERED (INSTANT)
              </div>
              <div className="p-4 overflow-y-auto flex-1 relative z-10">
                {comaParsed.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-300 text-sm font-mono">
                    {isStreaming ? "Connecting stream..." : "No data parsed."}
                  </div>
                ) : (
                  <Table data={comaParsed} type="coma" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple internal table component
function Table({
  data,
  type
}: {
  data: Partial<Startup>[]
  type: "native" | "partial" | "coma"
}) {
  const isComa = type === "coma"
  const isPartial = type === "partial"

  const headerColor = isComa
    ? "text-emerald-700"
    : isPartial
      ? "text-amber-700"
      : "text-zinc-500"
  const rowHighlight = isComa
    ? "hover:bg-emerald-50"
    : isPartial
      ? "hover:bg-amber-50"
      : "hover:bg-zinc-50"
  const textColor = isComa
    ? "text-emerald-900/80"
    : isPartial
      ? "text-amber-900/80"
      : "text-zinc-600"

  if (!data || data.length === 0) return null
  const keys = ["id", "name", "industry", "description"]

  return (
    <div className="w-full">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-black/5">
            {keys.map((k) => (
              <th
                key={k}
                className={`py-2 px-3 font-semibold ${headerColor} capitalize`}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data
            .filter((row) => row.id !== "id")
            .map((row, i) => (
              <tr
                key={i}
                className={`border-b border-black/5 group transition-colors ${rowHighlight}`}>
                {keys.map((k) => (
                  <td
                    key={k}
                    className={`py-2 px-3 ${textColor} max-w-[150px] truncate transition-colors`}
                    title={row[k]}>
                    {row[k] || (
                      <span
                        className={
                          isComa
                            ? "text-emerald-200"
                            : isPartial
                              ? "text-amber-200"
                              : "text-zinc-200"
                        }>
                        ...
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
