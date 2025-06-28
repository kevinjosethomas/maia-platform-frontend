import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ModalContainer } from '../Misc'
import {
  OverallPerformanceData,
  CompletedDrill,
  MoveAnalysis,
} from 'src/types/openings'

interface Props {
  performanceData: OverallPerformanceData
  onContinueAnalyzing: () => void
  onSelectNewOpenings: () => void
}

// Enhanced move quality distribution component - simplified to 3 categories like BlunderMeter
const MoveQualityDistribution: React.FC<{
  completedDrills: CompletedDrill[]
}> = ({ completedDrills }) => {
  const moveQualityData = useMemo(() => {
    let excellent = 0
    let goodMoves = 0
    let blunders = 0
    let total = 0

    completedDrills.forEach((drill) => {
      if (drill.moveAnalyses) {
        drill.moveAnalyses.forEach((analysis) => {
          if (analysis.isPlayerMove) {
            total++
            switch (analysis.classification) {
              case 'excellent':
                excellent++
                break
              case 'good':
              case 'inaccuracy':
              case 'mistake':
                goodMoves++
                break
              case 'blunder':
                blunders++
                break
            }
          }
        })
      } else {
        // Fallback to basic data if detailed analysis not available
        total += drill.totalMoves
        goodMoves += drill.goodMoves.length
        blunders += drill.blunders.length
      }
    })

    return [
      { name: 'Excellent', value: excellent, color: '#1a9850' },
      { name: 'Good Moves', value: goodMoves, color: '#fee08b' },
      { name: 'Blunders', value: blunders, color: '#d73027' },
    ].filter((item) => item.value > 0)
  }, [completedDrills])

  const totalMoves = moveQualityData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={moveQualityData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={false}
              labelLine={false}
            >
              {moveQualityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-4">
        {moveQualityData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-base font-medium">{item.name}</span>
            </div>
            <div className="text-base text-secondary">
              {item.value} ({Math.round((item.value / totalMoves) * 100)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const FinalCompletionModal: React.FC<Props> = ({
  performanceData,
  onContinueAnalyzing,
  onSelectNewOpenings,
}) => {
  const { totalDrills, completedDrills, totalBlunders, totalGoodMoves } =
    performanceData

  // Calculate best and worst performance based on Stockfish evaluation considering player color
  const { bestPerformance, worstPerformance } = useMemo(() => {
    if (completedDrills.length === 0) {
      return { bestPerformance: null, worstPerformance: null }
    }

    // Function to get normalized evaluation based on player color
    const getNormalizedEvaluation = (drill: CompletedDrill) => {
      const evaluation = drill.finalEvaluation
      // For white, positive evaluation is good; for black, negative evaluation is good
      return drill.selection.playerColor === 'white' ? evaluation : -evaluation
    }

    const best = completedDrills.reduce((best, drill) => {
      const currentEval = getNormalizedEvaluation(drill)
      const bestEval = getNormalizedEvaluation(best)
      return currentEval > bestEval ? drill : best
    }, completedDrills[0])

    const worst = completedDrills.reduce((worst, drill) => {
      const currentEval = getNormalizedEvaluation(drill)
      const worstEval = getNormalizedEvaluation(worst)
      return currentEval < worstEval ? drill : worst
    }, completedDrills[0])

    return { bestPerformance: best, worstPerformance: worst }
  }, [completedDrills])

  // Format evaluation for display
  const formatEvaluation = (
    evaluation: number,
    playerColor: 'white' | 'black',
  ) => {
    const displayEval = evaluation / 100 // Convert to pawns
    const isGoodForPlayer =
      playerColor === 'white' ? evaluation > 0 : evaluation < 0
    const prefix = evaluation > 0 ? '+' : ''
    const colorClass = isGoodForPlayer ? 'text-green-400' : 'text-red-400'

    return (
      <span className={colorClass}>
        {prefix}
        {displayEval.toFixed(2)}
      </span>
    )
  }

  return (
    <ModalContainer dismiss={onContinueAnalyzing}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative flex h-[90vh] max-h-[800px] w-[95vw] max-w-[1200px] flex-col overflow-hidden rounded-lg bg-background-1 shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6 text-center">
          <div className="mb-3">
            <span className="material-symbols-outlined text-7xl text-human-4">
              emoji_events
            </span>
          </div>
          <h2 className="text-4xl font-bold text-primary">
            Opening Mastery Complete!
          </h2>
          <p className="mt-3 text-lg text-secondary">
            Comprehensive analysis of your {totalDrills} opening drills
          </p>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Move Quality Distribution */}
          <div className="red-scrollbar flex w-1/2 flex-col overflow-y-auto border-r border-white/10 p-8">
            <h3 className="mb-6 text-2xl font-semibold">
              Move Quality Overview
            </h3>
            <MoveQualityDistribution completedDrills={completedDrills} />

            {/* Section Divider */}
            <div className="my-8 border-t border-white/10"></div>

            {/* Key Performance Metrics */}
            <div>
              <h4 className="mb-4 text-xl font-medium">Performance Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-base text-secondary">
                    Total Excellent/Good Moves
                  </span>
                  <span className="text-lg font-semibold text-green-400">
                    {totalGoodMoves}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-base text-secondary">
                    Total Blunders
                  </span>
                  <span className="text-lg font-semibold text-red-400">
                    {totalBlunders}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Performance Highlights & Drill List */}
          <div className="red-scrollbar flex w-1/2 flex-col overflow-y-auto p-8">
            <h3 className="mb-6 text-2xl font-semibold">
              Performance Highlights
            </h3>

            {/* Best Performance */}
            {bestPerformance && (
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <h4 className="text-lg font-medium text-green-400">
                    Best Performance
                  </h4>
                </div>
                <p className="mb-1 text-base text-primary">
                  {bestPerformance.selection.opening.name}
                  {bestPerformance.selection.variation &&
                    ` - ${bestPerformance.selection.variation.name}`}
                </p>
                <p className="text-sm text-secondary">
                  Final evaluation:{' '}
                  {formatEvaluation(
                    bestPerformance.finalEvaluation,
                    bestPerformance.selection.playerColor,
                  )}
                </p>
              </div>
            )}

            {/* Room for Improvement */}
            {worstPerformance && (
              <div className="mb-8">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <h4 className="text-lg font-medium text-yellow-400">
                    Room for Improvement
                  </h4>
                </div>
                <p className="mb-1 text-base text-primary">
                  {worstPerformance.selection.opening.name}
                  {worstPerformance.selection.variation &&
                    ` - ${worstPerformance.selection.variation.name}`}
                </p>
                <p className="text-sm text-secondary">
                  Final evaluation:{' '}
                  {formatEvaluation(
                    worstPerformance.finalEvaluation,
                    worstPerformance.selection.playerColor,
                  )}
                </p>
              </div>
            )}

            {/* Section Divider */}
            <div className="mb-6 border-t border-white/10"></div>

            {/* All Completed Drills */}
            <div className="flex-1">
              <h4 className="mb-4 text-xl font-medium">All Completed Drills</h4>
              <div className="red-scrollbar max-h-80 space-y-3 overflow-y-auto">
                {completedDrills.map((drill, index) => (
                  <div
                    key={drill.selection.id}
                    className="border-b border-white/5 pb-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="mb-1 text-base font-medium">
                          {drill.selection.opening.name}
                        </p>
                        {drill.selection.variation && (
                          <p className="text-sm text-secondary">
                            {drill.selection.variation.name}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-base font-medium">
                          {formatEvaluation(
                            drill.finalEvaluation,
                            drill.selection.playerColor,
                          )}
                        </p>
                        <p className="text-sm text-secondary">
                          {drill.totalMoves} moves
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 border-t border-white/10 p-6">
          <button
            onClick={onContinueAnalyzing}
            className="flex-1 rounded bg-background-2 py-3 text-base font-medium transition-colors hover:bg-background-3"
          >
            Continue Analyzing Openings
          </button>
          <button
            onClick={onSelectNewOpenings}
            className="flex-1 rounded bg-human-4 py-3 text-base font-medium transition-colors hover:bg-human-4/80"
          >
            Select New Openings to Practice
          </button>
        </div>
      </motion.div>
    </ModalContainer>
  )
}
