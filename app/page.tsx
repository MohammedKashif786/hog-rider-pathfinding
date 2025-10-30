"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface Cell {
  row: number
  col: number
}

interface GridCell {
  type: "open" | "obstacle" | "start" | "goal" | "path" | "visited"
}

const BFS_VISUALIZER = () => {
  const DEFAULT_ROWS = 9
  const DEFAULT_COLS = 10
  const [ROWS, setROWS] = useState(DEFAULT_ROWS)
  const [COLS, setCOLS] = useState(DEFAULT_COLS)
  const [grid, setGrid] = useState<GridCell[][]>([])
  const [path, setPath] = useState<Cell[]>([])
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [start] = useState<Cell>({ row: 0, col: 0 })
  const [goal, setGoal] = useState<Cell>({ row: DEFAULT_ROWS - 1, col: DEFAULT_COLS - 1 })

  const [inputRows, setInputRows] = useState(String(DEFAULT_ROWS))
  const [inputCols, setInputCols] = useState(String(DEFAULT_COLS))
  const [gridInput, setGridInput] = useState("")
  const [showInputForm, setShowInputForm] = useState(false)

  // Initialize grid
  const initializeGrid = (rows: number, cols: number, customGrid?: number[][]) => {
    const newGrid: GridCell[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill("open"))

    if (customGrid) {
      // Use custom grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (customGrid[r]?.[c] === 1) {
            newGrid[r][c] = "obstacle"
          }
        }
      }
    } else {
      // Add random obstacles
      for (let i = 0; i < rows * cols * 0.2; i++) {
        const r = Math.floor(Math.random() * rows)
        const c = Math.floor(Math.random() * cols)
        if (!(r === start.row && c === start.col) && !(r === rows - 1 && c === cols - 1)) {
          newGrid[r][c] = "obstacle"
        }
      }
    }

    newGrid[start.row][start.col] = "start"
    newGrid[rows - 1][cols - 1] = "goal"
    setGoal({ row: rows - 1, col: cols - 1 })
    setGrid(newGrid)
  }

  useEffect(() => {
    initializeGrid(ROWS, COLS)
  }, [ROWS, COLS])

  const applyCustomGrid = () => {
    try {
      const rows = Number.parseInt(inputRows)
      const cols = Number.parseInt(inputCols)

      if (rows < 2 || cols < 2 || rows > 20 || cols > 20) {
        alert("Grid dimensions must be between 2 and 20")
        return
      }

      const lines = gridInput.trim().split("\n")
      if (lines.length !== rows) {
        alert(`Expected ${rows} rows, got ${lines.length}`)
        return
      }

      const customGrid: number[][] = []
      for (let r = 0; r < rows; r++) {
        const values = lines[r].split(/\s+/).map(Number)
        if (values.length !== cols) {
          alert(`Row ${r + 1}: Expected ${cols} columns, got ${values.length}`)
          return
        }
        customGrid.push(values)
      }

      setROWS(rows)
      setCOLS(cols)
      initializeGrid(rows, cols, customGrid)
      setShowInputForm(false)
      reset()
    } catch (error) {
      alert("Invalid input format. Please check your grid data.")
    }
  }

  // BFS Algorithm
  const solveBFS = () => {
    if (grid.length === 0) return

    setIsAnimating(true)
    const queue: Cell[] = [start]
    const visitedSet = new Set<string>()
    const parent = new Map<string, Cell | null>()
    const visitedOrder: Cell[] = []

    visitedSet.add(`${start.row},${start.col}`)
    parent.set(`${start.row},${start.col}`, null)

    let found = false

    const bfsStep = () => {
      if (queue.length === 0) {
        setIsAnimating(false)
        return
      }

      const current = queue.shift()!
      visitedOrder.push(current)
      setVisited(new Set(visitedSet))

      if (current.row === goal.row && current.col === goal.col) {
        found = true
        // Reconstruct path
        const pathArray: Cell[] = []
        let node: Cell | null = current
        while (node) {
          pathArray.unshift(node)
          node = parent.get(`${node.row},${node.col}`) || null
        }
        setPath(pathArray)
        setIsAnimating(false)
        return
      }

      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]
      for (const [dr, dc] of directions) {
        const nr = current.row + dr
        const nc = current.col + dc
        const key = `${nr},${nc}`

        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visitedSet.has(key) && grid[nr]?.[nc] !== "obstacle") {
          visitedSet.add(key)
          parent.set(key, current)
          queue.push({ row: nr, col: nc })
        }
      }

      setTimeout(bfsStep, 50)
    }

    bfsStep()
  }

  const reset = () => {
    setPath([])
    setVisited(new Set())
    setCurrentStep(0)
    setIsAnimating(false)
  }

  // Animate character along path
  useEffect(() => {
    if (path.length === 0) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < path.length - 1) return prev + 1
        return prev
      })
    }, 300)

    return () => clearInterval(interval)
  }, [path])

  const currentCharPos = path[currentStep] || start

  const DustParticles = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-60"
            initial={{
              x: Math.random() * 100 + "%",
              y: -10,
              opacity: 0.6,
            }}
            animate={{
              y: "100vh",
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
              ease: "linear",
            }}
            style={{
              filter: "blur(1px)",
              boxShadow: "0 0 8px rgba(253, 224, 71, 0.8)",
            }}
          />
        ))}
      </div>
    )
  }

  const RippleEffect = ({ row, col }: { row: number; col: number }) => {
    return (
      <motion.div
        className="absolute inset-0 rounded-sm border-2 border-yellow-300"
        initial={{ scale: 0.8, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          pointerEvents: "none",
        }}
      />
    )
  }

  const ObstacleAnimation = () => {
    return (
      <motion.div
        className="absolute inset-0 rounded-sm"
        animate={{
          boxShadow: [
            "inset 0 0 0px rgba(255, 0, 0, 0)",
            "inset 0 0 8px rgba(255, 0, 0, 0.6)",
            "inset 0 0 0px rgba(255, 0, 0, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
        }}
      />
    )
  }

  const CloudSilhouettes = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl"
            initial={{ x: -100 }}
            animate={{ x: "110vw" }}
            transition={{
              duration: 20 + i * 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              top: `${20 + i * 25}%`,
              filter: "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))",
            }}
          >
            ☁️
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-purple-900 to-green-950">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hog%20rider%20running-Enw9MlPRfqS6UIpBJWez1hrjnTXUgc.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />

      <DustParticles />
      <CloudSilhouettes />

      {/* Main content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            <motion.img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hog-Rider-PNG-File-At7tPCkunPLo4jDC0w0QqkV33VnXp1.png"
              alt="Hog Rider"
              className="inline-block w-16 h-16 object-contain"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />{" "}
            Hog Rider's Tower Rush
          </h1>
          <p className="text-gray-300 text-lg">Find the shortest path using BFS and charge to victory!</p>
        </motion.div>

        <motion.button
          onClick={() => setShowInputForm(!showInputForm)}
          className="mb-6 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showInputForm ? "Hide Input Form" : "Custom Grid"}
        </motion.button>

        {showInputForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-slate-900/80 backdrop-blur-sm p-6 rounded-lg border-2 border-purple-500 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Custom Grid Input</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm mb-2">Rows</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={inputRows}
                    onChange={(e) => setInputRows(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-purple-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm mb-2">Columns</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={inputCols}
                    onChange={(e) => setInputCols(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-purple-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Grid Data (0=open, 1=obstacle)</label>
                <textarea
                  value={gridInput}
                  onChange={(e) => setGridInput(e.target.value)}
                  placeholder="0 0 0 0 0\n0 1 1 1 0\n0 0 0 0 0"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-purple-500 focus:outline-none focus:border-yellow-400 font-mono text-sm h-24"
                />
              </div>
              <button
                onClick={applyCustomGrid}
                className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Apply Grid
              </button>
            </div>
          </motion.div>
        )}

        {/* Grid Container with Arena Border */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          className="mb-8"
        >
          <div className="relative">
            <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-lg border-2 border-purple-500 shadow-2xl">
              <div
                className="grid gap-1 bg-slate-950 p-4 rounded"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                }}
              >
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isPath = path.some((p) => p.row === r && p.col === c)
                    const isVisited = visited.has(`${r},${c}`)
                    const isCurrentPos = currentCharPos.row === r && currentCharPos.col === c

                    let bgColor = "bg-slate-700"
                    if (cell === "obstacle") bgColor = "bg-gray-600"
                    if (cell === "start") bgColor = "bg-lime-500"
                    if (cell === "goal") bgColor = "bg-orange-500"
                    if (isPath) bgColor = "bg-cyan-400"
                    if (isVisited && !isPath) bgColor = "bg-yellow-400"

                    return (
                      <motion.div
                        key={`${r}-${c}`}
                        className={`w-8 h-8 rounded-sm ${bgColor} flex items-center justify-center relative transition-all duration-200 shadow-md`}
                        animate={{
                          scale: isCurrentPos ? 1.1 : 1,
                          boxShadow: isPath
                            ? [
                                "0 0 8px rgba(34, 211, 238, 0.5)",
                                "0 0 16px rgba(34, 211, 238, 0.8)",
                                "0 0 8px rgba(34, 211, 238, 0.5)",
                              ]
                            : "0 2px 4px rgba(0, 0, 0, 0.3)",
                        }}
                        transition={{
                          boxShadow: {
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                          },
                        }}
                      >
                        {isVisited && !isPath && !isCurrentPos && <RippleEffect row={r} col={c} />}

                        {cell === "obstacle" && <ObstacleAnimation />}

                        {isCurrentPos && (
                          <motion.img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hog-Rider-PNG-File-At7tPCkunPLo4jDC0w0QqkV33VnXp1.png"
                            alt="Hog Rider"
                            className="w-10 h-10 object-contain drop-shadow-lg"
                            animate={{
                              y: [0, -3, 0],
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 0.6,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          />
                        )}
                      </motion.div>
                    )
                  }),
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={solveBFS}
            disabled={isAnimating}
            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {isAnimating ? "Solving..." : "Solve with BFS"}
          </button>
          <button
            onClick={reset}
            className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all"
          >
            Reset
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-300 bg-slate-900/60 backdrop-blur-sm p-4 rounded-lg border border-purple-500"
        >
          <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
            ⚔️ Steps to Victory: {path.length > 0 ? path.length - 1 : "—"}
          </p>
          <div className="flex gap-6 justify-center text-sm">
            <div>
              <span className="text-yellow-400 font-semibold">Current Step:</span> {currentStep} / {path.length}
            </div>
            <div>
              <span className="text-cyan-400 font-semibold">Explored:</span> {visited.size} cells
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BFS_VISUALIZER
