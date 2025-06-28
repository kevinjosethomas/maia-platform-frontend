import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Chess } from 'chess.ts'
import Chessground from '@react-chess/chessground'
import type { Key } from 'chessground/types'
import type { DrawShape, DrawBrushes } from 'chessground/draw'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
  Tooltip,
} from 'recharts'
import { ModalContainer } from '../Misc'
import { DrillPerformanceData, MoveAnalysis } from 'src/types/openings'
import { cpToWinrate } from 'src/utils/stockfish'

interface Props {
  performanceData: DrillPerformanceData
  onContinueAnalyzing: () => void
  onNextDrill: () => void
  isLastDrill: boolean
}

// Component for animated game replay
const AnimatedGameReplay: React.FC<{
  moveAnalyses: MoveAnalysis[]
  openingFen: string
  playerColor: 'white' | 'black'
  onMoveIndexChange?: (index: number) => void
  externalMoveIndex?: number
  onMoveClick?: (moveIndex: number) => void
}> = ({
  moveAnalyses,
  openingFen,
  playerColor,
  onMoveIndexChange,
  externalMoveIndex,
  onMoveClick,
}) => {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [chess] = useState(() => new Chess(openingFen))
  const [currentFen, setCurrentFen] = useState(openingFen)
  const [currentMoveQuality, setCurrentMoveQuality] = useState<string | null>(
    null,
  )

  // Reset to opening position
  const resetToStart = useCallback(() => {
    chess.load(openingFen)
    setCurrentFen(openingFen)
    setCurrentMoveIndex(-1)
    setCurrentMoveQuality(null)
    onMoveIndexChange?.(-1)
  }, [chess, openingFen, onMoveIndexChange])

  // Go to specific move
  const goToMove = useCallback(
    (moveIndex: number) => {
      chess.load(openingFen)
      setCurrentMoveIndex(moveIndex)
      onMoveIndexChange?.(moveIndex)

      for (let i = 0; i <= moveIndex && i < moveAnalyses.length; i++) {
        const move = moveAnalyses[i]
        try {
          chess.move(move.move, { sloppy: true })
        } catch (error) {
          console.error('Error making move:', move.move, error)
          break
        }
      }

      setCurrentFen(chess.fen())

      if (moveIndex >= 0 && moveIndex < moveAnalyses.length) {
        const currentMove = moveAnalyses[moveIndex]
        if (currentMove.isPlayerMove) {
          setCurrentMoveQuality(currentMove.classification)
        } else {
          setCurrentMoveQuality(null)
        }
      } else {
        setCurrentMoveQuality(null)
      }
    },
    [chess, openingFen, moveAnalyses, onMoveIndexChange],
  )

  // Respond to external move index changes (from chart hover)
  useEffect(() => {
    if (
      externalMoveIndex !== undefined &&
      externalMoveIndex !== currentMoveIndex
    ) {
      goToMove(externalMoveIndex)
    }
  }, [externalMoveIndex, currentMoveIndex, goToMove])

  // Remove auto-play - now controlled by chart interaction
  // Auto-play animation with continuous looping
  // useEffect(() => {
  //   if (!isPlaying) return

  //   const timer = setTimeout(() => {
  //     if (currentMoveIndex < moveAnalyses.length - 1) {
  //       goToMove(currentMoveIndex + 1)
  //     } else {
  //       // Loop back to the beginning
  //       resetToStart()
  //     }
  //   }, 1500) // Slightly slower for better viewing

  //   return () => clearTimeout(timer)
  // }, [isPlaying, currentMoveIndex, moveAnalyses.length, goToMove, resetToStart])

  // // Start playing automatically on mount
  // useEffect(() => {
  //   if (moveAnalyses.length > 0) {
  //     const timer = setTimeout(() => {
  //       setIsPlaying(true)
  //     }, 1000) // Start after 1 second
  //     return () => clearTimeout(timer)
  //   }
  // }, [moveAnalyses.length])

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-400'
      case 'inaccuracy':
        return 'text-yellow-400'
      case 'blunder':
        return 'text-red-400'
      default:
        return 'text-secondary'
    }
  }

  const getQualitySymbol = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '!!'
      case 'inaccuracy':
        return '?!'
      case 'blunder':
        return '??'
      default:
        return '' // No symbol for normal/good moves
    }
  }

  // Classify move based on winrate loss (using proper winrate calculation)
  const classifyMove = (analysis: MoveAnalysis, moveIndex: number): string => {
    // Need evaluation before and after the move to calculate winrate change
    if (moveIndex === 0) return '' // Can't calculate for first move

    const currentEval = analysis.evaluation
    const previousEval = moveAnalyses[moveIndex - 1]?.evaluation

    if (currentEval === undefined || previousEval === undefined) return ''

    // Convert evaluations to winrates (assuming evaluations are already in centipawns)
    const currentWinrate = cpToWinrate(currentEval)
    const previousWinrate = cpToWinrate(previousEval)

    // Calculate winrate change from player's perspective
    let winrateChange: number

    if (analysis.isPlayerMove) {
      // For player moves, we need to consider which color they're playing
      if (playerColor === 'white') {
        // Higher evaluation is better for white
        winrateChange = currentWinrate - previousWinrate
      } else {
        // Lower evaluation is better for black
        winrateChange = previousWinrate - currentWinrate
      }
    } else {
      // For opponent (Maia) moves, we don't classify them
      return ''
    }

    // Use more reasonable thresholds - excellent moves should be rare
    const BLUNDER_THRESHOLD = 0.1 // 10% winrate drop - significant mistake
    const INACCURACY_THRESHOLD = 0.05 // 5% winrate drop - noticeable error
    const EXCELLENT_THRESHOLD = 0.08 // 8% winrate gain - very good move

    if (winrateChange <= -BLUNDER_THRESHOLD) {
      return 'blunder'
    } else if (winrateChange <= -INACCURACY_THRESHOLD) {
      return 'inaccuracy'
    } else if (winrateChange >= EXCELLENT_THRESHOLD) {
      return 'excellent'
    }

    return '' // Normal moves get no classification
  }

  // Helper function to pair moves for display
  const pairMoves = (moves: MoveAnalysis[]) => {
    const pairs: Array<{
      white?: MoveAnalysis & { index: number }
      black?: MoveAnalysis & { index: number }
    }> = []

    for (let i = 0; i < moves.length; i += 2) {
      const white = moves[i] ? { ...moves[i], index: i } : undefined
      const black = moves[i + 1] ? { ...moves[i + 1], index: i + 1 } : undefined
      pairs.push({ white, black })
    }

    return pairs
  }

  // Get arrows for optimal moves from the current position (before next move is played)
  const getArrowsForCurrentMove = useCallback((): DrawShape[] => {
    // Show arrows for the position we're currently viewing
    // If we're at the start (currentMoveIndex = -1), show arrows for the opening position
    // If we're at move N, show arrows for what's optimal from the current position
    const positionIndex = currentMoveIndex + 1 // Next move to be analyzed

    if (positionIndex < 0 || positionIndex >= moveAnalyses.length) {
      return []
    }

    const arrows: DrawShape[] = []
    const nextMove = moveAnalyses[positionIndex]

    // Show arrows for any position where we have analysis data
    try {
      // Maia best move (red arrow - user requested red for Maia)
      if (nextMove.maiaBestMove && nextMove.maiaBestMove.length === 4) {
        arrows.push({
          brush: 'red',
          orig: nextMove.maiaBestMove.slice(0, 2) as Key,
          dest: nextMove.maiaBestMove.slice(2, 4) as Key,
        })
      }

      // Stockfish best move (blue arrow - user requested blue for Stockfish)
      if (
        nextMove.stockfishBestMove &&
        nextMove.stockfishBestMove.length === 4 &&
        nextMove.stockfishBestMove !== nextMove.maiaBestMove
      ) {
        arrows.push({
          brush: 'blue',
          orig: nextMove.stockfishBestMove.slice(0, 2) as Key,
          dest: nextMove.stockfishBestMove.slice(2, 4) as Key,
          modifiers: { lineWidth: 8 },
        })
      }
    } catch (error) {
      // Move parsing failed, skip arrows
      console.warn('Error creating arrows:', error)
    }

    return arrows
  }, [currentMoveIndex, moveAnalyses])

  return (
    <div className="flex h-full flex-col">
      {/* Game Replay Section with padding */}
      <div className="p-4">
        <div>
          <h3 className="mb-1 text-lg font-semibold">Game Replay</h3>
          <p className="mb-3 text-sm text-secondary">
            Watch your opening unfold with move quality indicators
          </p>
        </div>

        {/* Chess Board */}
        <div className="relative mx-auto aspect-square w-full max-w-[280px]">
          <Chessground
            contained
            config={{
              viewOnly: true,
              fen: currentFen,
              orientation: playerColor,
              coordinates: true,
              animation: { enabled: true, duration: 200 },
              drawable: {
                enabled: true,
                visible: true,
                defaultSnapToValidMove: false,
                autoShapes: getArrowsForCurrentMove(),
                brushes: {
                  red: {
                    key: 'red',
                    color: '#dc2626',
                    opacity: 0.8,
                    lineWidth: 8,
                  },
                  blue: {
                    key: 'blue',
                    color: '#2563eb',
                    opacity: 0.8,
                    lineWidth: 8,
                  },
                } as DrawBrushes,
              },
            }}
          />

          {/* Move Quality Overlay */}
          {currentMoveQuality && (
            <div className="absolute right-2 top-2 z-50 rounded border border-white/20 bg-background-1/95 px-2 py-1 shadow-lg">
              <div
                className={`font-mono text-sm font-bold ${getQualityColor(currentMoveQuality)}`}
              >
                {getQualitySymbol(currentMoveQuality)}
              </div>
              <div className="text-xs capitalize text-secondary">
                {currentMoveQuality}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move History - No padding, fills remaining height */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-white/10">
        <div className="red-scrollbar flex-1 overflow-y-auto">
          <div className="grid auto-rows-min grid-cols-5 whitespace-nowrap rounded-none bg-background-1/60">
            {pairMoves(moveAnalyses).map((pair, index) => (
              <React.Fragment key={index}>
                {/* Move number */}
                <span className="flex h-7 items-center justify-center bg-background-2 text-sm text-secondary">
                  {index + 1}
                </span>

                {/* White's move */}
                <div
                  role="button"
                  tabIndex={0}
                  className={`col-span-2 flex h-7 cursor-pointer items-center justify-between px-2 text-sm hover:bg-background-2 ${
                    externalMoveIndex === pair.white?.index
                      ? 'bg-human-4/20'
                      : ''
                  }`}
                  onClick={() => pair.white && onMoveClick?.(pair.white.index)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && pair.white) {
                      e.preventDefault()
                      onMoveClick?.(pair.white.index)
                    }
                  }}
                >
                  <span>{pair.white?.san || ''}</span>
                  <div className="flex items-center">
                    {pair.white &&
                      (() => {
                        const classification = classifyMove(
                          pair.white,
                          pair.white.index,
                        )
                        const symbol = getQualitySymbol(classification)
                        return symbol ? (
                          <span
                            className={`ml-1 text-xs font-bold ${getQualityColor(classification)}`}
                          >
                            {symbol}
                          </span>
                        ) : null
                      })()}
                  </div>
                </div>

                {/* Black's move */}
                <div
                  role="button"
                  tabIndex={0}
                  className={`col-span-2 flex h-7 cursor-pointer items-center justify-between px-2 text-sm hover:bg-background-2 ${
                    externalMoveIndex === pair.black?.index
                      ? 'bg-human-4/20'
                      : ''
                  }`}
                  onClick={() => pair.black && onMoveClick?.(pair.black.index)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && pair.black) {
                      e.preventDefault()
                      onMoveClick?.(pair.black.index)
                    }
                  }}
                >
                  <span>{pair.black?.san || ''}</span>
                  <div className="flex items-center">
                    {pair.black &&
                      (() => {
                        const classification = classifyMove(
                          pair.black,
                          pair.black.index,
                        )
                        const symbol = getQualitySymbol(classification)
                        return symbol ? (
                          <span
                            className={`ml-1 text-xs font-bold ${getQualityColor(classification)}`}
                          >
                            {symbol}
                          </span>
                        ) : null
                      })()}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom dot component for move quality indicators
const CustomDot: React.FC<any> = (props) => {
  const { cx, cy, payload, index } = props
  if (!payload) return null

  const isPlayerMove = payload.isPlayerMove
  const classification = payload.classification
  const isCurrentMove = payload.isCurrentMove

  // Only show indicators for notable moves (like MovesContainer.tsx)
  let color = '#9ca3af' // Default gray
  let radius = 3

  // Only highlight notable moves
  switch (classification) {
    case 'excellent':
      color = '#10b981' // Green
      radius = 5
      break
    case 'inaccuracy':
      color = '#eab308' // Yellow
      radius = 4
      break
    case 'blunder':
      color = '#ef4444' // Red
      radius = 5
      break
    default:
      // Normal/good moves get default appearance
      radius = 3
  }

  const strokeColor =
    classification === 'excellent' || classification === 'blunder'
      ? '#ffffff'
      : '#1f2937'
  const strokeWidth = 0.5

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={radius}
      fill={color}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  )
}

// Custom tooltip component
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload[0]) return null

  const data = payload[0].payload
  const plyNumber = parseInt(label as string)
  const moveNumber = Math.ceil(plyNumber / 2)
  const isWhiteMove = plyNumber % 2 === 1
  const moveNotation = isWhiteMove ? `${moveNumber}.` : `...${moveNumber}.`

  const formatEvaluation = (evaluation: number) => {
    if (Math.abs(evaluation) >= 1000) {
      return evaluation > 0 ? '+M' : '-M'
    }
    return evaluation > 0
      ? `+${(evaluation / 100).toFixed(1)}`
      : `${(evaluation / 100).toFixed(1)}`
  }

  return (
    <div className="rounded border border-white/20 bg-background-1/95 p-3 shadow-lg">
      <p className="text-sm font-medium text-primary">
        {data.san ? `${moveNotation} ${data.san}` : `${moveNotation}`}
      </p>
      <p className="text-sm text-secondary">
        Evaluation: {formatEvaluation(data.evaluation)}
      </p>
      {data.classification &&
        ['excellent', 'inaccuracy', 'blunder'].includes(
          data.classification,
        ) && (
          <p
            className={`text-sm capitalize ${
              data.classification === 'excellent'
                ? 'text-green-400'
                : data.classification === 'blunder'
                  ? 'text-red-400'
                  : 'text-yellow-400'
            }`}
          >
            {data.classification} {data.isPlayerMove ? '(You)' : '(Maia)'}
          </p>
        )}
    </div>
  )
}

// Component for the evaluation chart using Recharts
const EvaluationChart: React.FC<{
  evaluationChart: DrillPerformanceData['evaluationChart']
  moveAnalyses: MoveAnalysis[]
  currentMoveIndex?: number
  onHoverMove?: (moveIndex: number) => void
  playerColor: 'white' | 'black'
}> = ({
  evaluationChart,
  moveAnalyses,
  currentMoveIndex = -1,
  onHoverMove,
  playerColor,
}) => {
  if (evaluationChart.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded bg-background-2 text-secondary">
        <p>Evaluation chart unavailable</p>
      </div>
    )
  }

  // Classify move based on evaluationLoss (same logic as in AnimatedGameReplay)
  const classifyMove = (analysis: MoveAnalysis, moveIndex: number): string => {
    // Need evaluation before and after the move to calculate winrate change
    if (moveIndex === 0) return '' // Can't calculate for first move

    const currentEval = analysis.evaluation
    const previousEval = moveAnalyses[moveIndex - 1]?.evaluation

    if (currentEval === undefined || previousEval === undefined) return ''

    // Convert evaluations to winrates (assuming evaluations are already in centipawns)
    const currentWinrate = cpToWinrate(currentEval)
    const previousWinrate = cpToWinrate(previousEval)

    // Calculate winrate change from player's perspective
    let winrateChange: number

    if (analysis.isPlayerMove) {
      // For player moves, we need to consider which color they're playing
      if (playerColor === 'white') {
        // Higher evaluation is better for white
        winrateChange = currentWinrate - previousWinrate
      } else {
        // Lower evaluation is better for black
        winrateChange = previousWinrate - currentWinrate
      }
    } else {
      // For opponent (Maia) moves, we don't classify them
      return ''
    }

    // Use more reasonable thresholds - excellent moves should be rare
    const BLUNDER_THRESHOLD = 0.1 // 10% winrate drop - significant mistake
    const INACCURACY_THRESHOLD = 0.05 // 5% winrate drop - noticeable error
    const EXCELLENT_THRESHOLD = 0.08 // 8% winrate gain - very good move

    if (winrateChange <= -BLUNDER_THRESHOLD) {
      return 'blunder'
    } else if (winrateChange <= -INACCURACY_THRESHOLD) {
      return 'inaccuracy'
    } else if (winrateChange >= EXCELLENT_THRESHOLD) {
      return 'excellent'
    }

    return '' // Normal moves get no classification
  }

  // Transform data for Recharts with proper area handling at zero crossings
  const chartData = evaluationChart.map((point, index) => {
    // Find corresponding move analysis to get SAN notation and proper classification
    const moveAnalysis = moveAnalyses[index]

    // Use dynamic classification based on winrate loss
    const dynamicClassification = moveAnalysis
      ? classifyMove(moveAnalysis, index)
      : ''

    return {
      moveNumber: index + 1,
      evaluation: point.evaluation,
      isPlayerMove: point.isPlayerMove,
      classification: dynamicClassification, // Use dynamic classification
      isCurrentMove: index === currentMoveIndex,
      san: moveAnalysis?.san || '',
      // Areas extend from zero line to evaluation (no gaps)
      whiteAdvantage: point.evaluation > 0 ? point.evaluation : 0,
      blackAdvantage: point.evaluation < 0 ? point.evaluation : 0,
      // Add zero baseline for proper area rendering
      zero: 0,
    }
  })

  // Calculate evaluation bounds for Y-axis
  const maxEval = Math.max(
    Math.abs(Math.max(...evaluationChart.map((point) => point.evaluation))),
    Math.abs(Math.min(...evaluationChart.map((point) => point.evaluation))),
    300,
  )

  const formatEvaluation = (evaluation: number) => {
    if (Math.abs(evaluation) >= 1000) {
      return evaluation > 0 ? '+M' : '-M'
    }
    return evaluation > 0
      ? `+${(evaluation / 100).toFixed(1)}`
      : `${(evaluation / 100).toFixed(1)}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-lg font-semibold">Position Evaluation</h3>
        <p className="mb-3 text-sm text-secondary">
          Track how the position&apos;s value changed throughout the
          post-opening
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -20, bottom: 20 }}
            onMouseMove={(data) => {
              if (data && data.activeLabel && onHoverMove) {
                const moveIndex = parseInt(data.activeLabel as string) - 1
                onHoverMove(moveIndex)
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="moveNumber"
              stroke="#9ca3af"
              fontSize={11}
              label={{
                value: 'Ply Number',
                position: 'insideBottom',
                style: {
                  textAnchor: 'middle',
                  fill: '#9ca3af',
                  fontSize: '11px',
                },
              }}
            />
            <YAxis
              domain={[-maxEval, maxEval]}
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={formatEvaluation}
              label={{
                value: 'Evaluation',
                angle: -90,
                dx: 24,
                position: 'insideLeft',
                style: {
                  textAnchor: 'middle',
                  fill: '#9ca3af',
                  fontSize: '11px',
                },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* White advantage area (positive evaluations only) */}
            <Area
              type="monotone"
              dataKey="whiteAdvantage"
              stroke="none"
              fill="rgba(255, 255, 255, 0.4)"
              fillOpacity={0.5}
              connectNulls={false}
            />

            {/* Black advantage area (negative evaluations only) */}
            <Area
              type="monotone"
              dataKey="blackAdvantage"
              stroke="none"
              fill="rgba(75, 85, 99, 0.5)"
              fillOpacity={0.6}
              connectNulls={false}
            />

            {/* Reference line at 0 evaluation - no interaction */}
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1}
              strokeDasharray="2 2"
              ifOverflow="extendDomain"
            />

            <Line
              type="monotone"
              dataKey="evaluation"
              stroke="#e5e7eb"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-400"></div>
          <span className="text-secondary">Excellent (!!)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
          <span className="text-secondary">Inaccuracy (?!)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400"></div>
          <span className="text-secondary">Blunder (??)</span>
        </div>
      </div>
    </div>
  )
}

// Component for key moments analysis
const KeyMomentsAnalysis: React.FC<{
  moveAnalyses: MoveAnalysis[]
  evaluationChart: DrillPerformanceData['evaluationChart']
  playerColor: 'white' | 'black'
}> = ({ moveAnalyses, evaluationChart, playerColor }) => {
  // Classify move based on winrate loss (same logic as other components)
  const classifyMove = (analysis: MoveAnalysis, moveIndex: number): string => {
    if (moveIndex === 0) return ''

    const currentEval = analysis.evaluation
    const previousEval = moveAnalyses[moveIndex - 1]?.evaluation

    if (currentEval === undefined || previousEval === undefined) return ''

    const currentWinrate = cpToWinrate(currentEval)
    const previousWinrate = cpToWinrate(previousEval)

    if (!analysis.isPlayerMove) return ''

    let winrateChange: number
    if (playerColor === 'white') {
      winrateChange = currentWinrate - previousWinrate
    } else {
      winrateChange = previousWinrate - currentWinrate
    }

    const BLUNDER_THRESHOLD = 0.1
    const INACCURACY_THRESHOLD = 0.05
    const EXCELLENT_THRESHOLD = 0.08

    if (winrateChange <= -BLUNDER_THRESHOLD) {
      return 'blunder'
    } else if (winrateChange <= -INACCURACY_THRESHOLD) {
      return 'inaccuracy'
    } else if (winrateChange >= EXCELLENT_THRESHOLD) {
      return 'excellent'
    }

    return ''
  }

  // Find engine agreement moments (where user matched Stockfish exactly)
  const engineAgreements = moveAnalyses
    .map((analysis, index) => ({
      ...analysis,
      index,
      plyNumber: index + 1,
    }))
    .filter(
      (analysis) =>
        analysis.isPlayerMove &&
        analysis.stockfishBestMove &&
        analysis.san === analysis.stockfishBestMove,
    )
    .slice(0, 3) // Show top 3

  // Find critical decision points (largest evaluation swings)
  const criticalMoments = evaluationChart
    .map((point, index) => {
      if (index === 0) return null
      const evalChange = Math.abs(
        point.evaluation - evaluationChart[index - 1].evaluation,
      )
      const moveAnalysis = moveAnalyses[index]
      return {
        index,
        plyNumber: index + 1,
        evalChange,
        moveAnalysis,
        isPlayerMove: point.isPlayerMove,
        evaluation: point.evaluation,
        previousEvaluation: evaluationChart[index - 1].evaluation,
      }
    })
    .filter(
      (moment): moment is NonNullable<typeof moment> =>
        moment !== null && moment.isPlayerMove && moment.evalChange > 50,
    )
    .sort((a, b) => b.evalChange - a.evalChange)
    .slice(0, 3) // Show top 3

  // Analyze patterns for insights
  const playerMoves = moveAnalyses.filter((m) => m.isPlayerMove)

  const formatEvaluation = (evaluation: number) => {
    if (Math.abs(evaluation) >= 1000) {
      return evaluation > 0 ? '+M' : '-M'
    }
    return evaluation > 0
      ? `+${(evaluation / 100).toFixed(1)}`
      : `${(evaluation / 100).toFixed(1)}`
  }

  return (
    <div className="space-y-6">
      {/* Engine Agreement Section */}
      {engineAgreements.length > 0 && (
        <div>
          <h3 className="mb-1 text-lg font-semibold text-engine-4">
            Engine Agreement
          </h3>
          <p className="mb-3 text-sm text-secondary">
            Moves where you matched Stockfish exactly
          </p>
          <div className="space-y-3">
            {engineAgreements.map((agreement) => (
              <div
                key={agreement.index}
                className="flex items-center justify-between rounded border border-white/10 p-3"
              >
                <div>
                  <span className="text-base font-medium">
                    {agreement.plyNumber}. {agreement.san}
                  </span>
                  <p className="text-sm text-secondary">
                    {agreement.classification === 'excellent' && (
                      <span className="font-bold text-green-400">!! </span>
                    )}
                    Perfect engine choice
                  </p>
                </div>
                <div className="text-sm font-medium text-engine-4">
                  {formatEvaluation(agreement.evaluation || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Moments Section */}
      {criticalMoments.length > 0 && (
        <div>
          <h3 className="mb-1 text-lg font-semibold text-human-3">
            Critical Decisions
          </h3>
          <p className="mb-3 text-sm text-secondary">
            Key moments that shifted the evaluation
          </p>
          <div className="space-y-3">
            {criticalMoments.map((moment) => (
              <div
                key={moment.index}
                className="flex items-center justify-between rounded border border-white/10 p-3"
              >
                <div>
                  <span className="text-base font-medium">
                    {moment.plyNumber}. {moment.moveAnalysis?.san}
                  </span>
                  <p className="text-sm text-secondary">
                    {(() => {
                      const dynamicClassification = moment.moveAnalysis
                        ? classifyMove(moment.moveAnalysis, moment.index)
                        : ''

                      if (dynamicClassification === 'blunder') {
                        return (
                          <span className="font-bold text-red-400">?? </span>
                        )
                      } else if (dynamicClassification === 'excellent') {
                        return (
                          <span className="font-bold text-green-400">!! </span>
                        )
                      } else if (dynamicClassification === 'inaccuracy') {
                        return (
                          <span className="font-bold text-yellow-400">?! </span>
                        )
                      }
                      return null
                    })()}
                    Evaluation swing: {(moment.evalChange / 100).toFixed(1)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="text-secondary">
                    {formatEvaluation(moment.previousEvaluation)} →
                  </div>
                  <div
                    className={
                      moment.evaluation > moment.previousEvaluation
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {formatEvaluation(moment.evaluation)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const DrillPerformanceModal: React.FC<Props> = ({
  performanceData,
  onContinueAnalyzing,
  onNextDrill,
  isLastDrill,
}) => {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [hoveredMoveIndex, setHoveredMoveIndex] = useState<number | null>(null)

  const { drill, evaluationChart, moveAnalyses } = performanceData

  // Handle hover on chart - update board position
  const handleChartHover = (moveIndex: number) => {
    setHoveredMoveIndex(moveIndex)
  }

  // Handle click on move list
  const handleMoveClick = (moveIndex: number) => {
    setCurrentMoveIndex(moveIndex)
  }

  // Get opening FEN from the drill
  const openingFen = drill.selection.variation
    ? drill.selection.variation.fen
    : drill.selection.opening.fen

  return (
    <ModalContainer dismiss={onContinueAnalyzing}>
      <div className="relative flex h-[90vh] max-h-[800px] w-[95vw] max-w-[1200px] flex-col overflow-hidden rounded-lg bg-background-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h2 className="text-xl font-bold text-primary">
              Opening Analysis Complete
            </h2>
            <div className="mt-1">
              <p className="text-base font-medium text-secondary">
                {drill.selection.opening.name}
                {drill.selection.variation &&
                  ` - ${drill.selection.variation.name}`}
                {' • '}
                Analyzed {moveAnalyses.filter((m) => m.isPlayerMove).length} of
                your moves
                {' • '}
                Playing as{' '}
                {drill.selection.playerColor === 'white' ? 'White' : 'Black'}
              </p>
            </div>
          </div>
          <button
            onClick={onContinueAnalyzing}
            className="text-secondary hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Animated Game Replay */}
          <div className="flex w-1/3 flex-col border-r border-white/10">
            <AnimatedGameReplay
              moveAnalyses={moveAnalyses}
              openingFen={openingFen}
              playerColor={drill.selection.playerColor}
              onMoveIndexChange={setCurrentMoveIndex}
              externalMoveIndex={hoveredMoveIndex ?? undefined}
              onMoveClick={handleMoveClick}
            />
          </div>

          {/* Center Panel - Evaluation Chart */}
          <div className="red-scrollbar flex w-1/3 flex-col gap-3 overflow-y-auto border-r border-white/10 p-4">
            <EvaluationChart
              evaluationChart={evaluationChart}
              moveAnalyses={moveAnalyses}
              currentMoveIndex={currentMoveIndex}
              onHoverMove={handleChartHover}
              playerColor={drill.selection.playerColor}
            />
          </div>

          {/* Right Panel - Key Moments Analysis */}
          <div className="red-scrollbar flex w-1/3 flex-col gap-3 overflow-y-auto p-4">
            <KeyMomentsAnalysis
              moveAnalyses={moveAnalyses}
              evaluationChart={evaluationChart}
              playerColor={drill.selection.playerColor}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 border-t border-white/10 p-4">
          <button
            onClick={onContinueAnalyzing}
            className="flex-1 rounded bg-background-2 py-2 font-medium transition-colors hover:bg-background-3"
          >
            Continue Analyzing
          </button>
          <button
            onClick={onNextDrill}
            className="flex-1 rounded bg-human-4 py-2 font-medium transition-colors hover:bg-human-4/80"
          >
            {isLastDrill ? 'View Summary' : 'Next Drill'}
          </button>
        </div>
      </div>
    </ModalContainer>
  )
}
