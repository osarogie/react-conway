import React, { useState, useCallback, useRef, useEffect } from "react"
import produce from "immer"
import { useLocalStorage } from "../src/hooks/useStorage"

let operations = [
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
]

export default function Index() {
  let [cellSize, setCellSize] = useLocalStorage("conway:cellSize", 30)
  let [numRows, setNumRows] = useLocalStorage("conway:numRows", 15)
  let [numCols, setNumCols] = useLocalStorage("conway:numCols", 20)
  let [generations, setGenerations] = useState(0)

  let generateEmptyGrid = useCallback(() => {
    let rows = []
    for (let i = 0; i < numRows; i++) {
      rows.push(Array.from(Array(numCols), () => 0))
    }
    return rows
  }, [numRows, numCols])

  let generateRandomGrid = useCallback(() => {
    let rows = []
    for (let i = 0; i < numRows; i++) {
      rows.push(Array.from(Array(numCols), () => Math.round(Math.random())))
    }
    return rows
  }, [numRows, numCols])

  let [grid, setGrid] = useState(generateEmptyGrid)
  let [running, setRunning] = useState(false)

  let runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    setGrid(generateEmptyGrid)
  }, [numRows, numCols])

  let runSimulation = useCallback(() => {
    if (!runningRef.current) return
    setGrid(grid =>
      produce(grid, gridCopy => {
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            let neighbours = 0
            operations.forEach(([x, y]) => {
              let newI = i + x
              let newK = j + y

              if (newI >= 0 && newI < numRows && newK >= 0 && newK < numCols) {
                neighbours += grid[newI][newK]
              }
            })
            if (neighbours < 2 || neighbours > 3) gridCopy[i][j] = 0
            else if (grid[i][j] === 0 && neighbours == 3) gridCopy[i][j] = 1
          }
        }
        return gridCopy
      })
    )
    setGenerations(generation => generation + 1)

    let handle = setTimeout(runSimulation, 100)
    return () => {
      clearTimeout(handle)
    }
  }, [numCols, numRows])

  let toggleCell = useCallback(({ row, col }) => {
    setGrid(grid =>
      produce(grid, gridCopy => {
        if (gridCopy[row][col] === 1) gridCopy[row][col] = 0
        else gridCopy[row][col] = 1

        return gridCopy
      })
    )
  }, [])

  let toggleRunning = useCallback(() => {
    setRunning(running => !running)
    if (!running) {
      setGenerations(0)
      runningRef.current = true
      runSimulation()
    }
  }, [running])

  let clear = useCallback(() => {
    setGrid(generateEmptyGrid)
  }, [])

  let random = useCallback(() => {
    setGrid(generateRandomGrid)
  }, [])

  if (typeof window === "undefined") return null

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <button id="start" onClick={toggleRunning}>
          {running ? "Stop" : "Start"}
        </button>
        <button onClick={random}>Random</button>
        <button onClick={clear}>Clear</button>

        <span>Rows</span>
        <input
          type="number"
          min={0}
          maxLength={3}
          max={999}
          onChange={e => setNumRows(e.target.value | 0)}
          value={numRows}
        />

        <span>Columns</span>
        <input
          type="number"
          min={0}
          maxLength={3}
          max={999}
          onChange={e => setNumCols(e.target.value | 0)}
          value={numCols}
        />

        <span>Cell Size</span>
        <input
          type="number"
          maxLength={2}
          min={0}
          max={99}
          onChange={e => setCellSize(e.target.value | 0)}
          value={cellSize}
        />
        <style jsx>{`
          button,
          input {
            margin-right: 10px;
            border: 2px solid black;
            padding: 5px 10px;
            background-color: #fff;
          }
          #start {
            width: 100px;
            background-color: ${running ? "#228811" : "#fff"};
            color: ${running ? "#fff" : "#000"};
          }
          button:active {
            background-color: #228811;
            color: #fff;
          }
          input {
            width: 50px;
            margin-left: 10px;
          }
        `}</style>
      </div>
      <Grid cellSize={cellSize} numCols={numCols}>
        {grid.map((row, i) =>
          row.map((state, j) => (
            <Cell
              key={`${i}-${j}`}
              row={i}
              col={j}
              state={state}
              size={cellSize}
              toggle={toggleCell}
            />
          ))
        )}
      </Grid>
      <i style={{ marginTop: 10, marginBottom: 20 }}>
        Generations: {generations}
      </i>
    </>
  )
}

function Grid({ children, cellSize, numCols }) {
  return (
    <div style={{ display: "table" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
          borderTop: "2px solid black",
          borderRight: "2px solid black",
          paddingRight: 2,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Cell({ row, col, state, toggle, size }) {
  let handleClick = useCallback(() => {
    toggle?.({ row, col })
  }, [toggle, row, col])
  return (
    <div onClick={handleClick}>
      <style jsx>{`
        width: ${size}px;
        height: ${size}px;
        border-left: 2px solid #444;
        border-bottom: 2px solid #444;
        background-color: ${state === 1 ? "#0003" : "#fff"};
      `}</style>
    </div>
  )
}
