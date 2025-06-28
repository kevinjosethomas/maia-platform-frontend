import React from 'react'
import { ColorSanMapping } from 'src/types'

interface MoveTooltipProps {
  move: string
  colorSanMapping: ColorSanMapping
  maiaProb?: number
  stockfishCp?: number
  stockfishWinrate?: number
  stockfishLoss?: number
  position?: { x: number; y: number }
  isVisible?: boolean
}

export const MoveTooltip: React.FC<MoveTooltipProps> = ({
  move,
  colorSanMapping,
  maiaProb,
  stockfishCp,
  stockfishWinrate,
  stockfishLoss,
  position,
  isVisible = true,
}) => {
  if (!isVisible || !position) return null

  const san = colorSanMapping[move]?.san ?? move
  const color = colorSanMapping[move]?.color ?? '#fff'

  return (
    <div
      className="pointer-events-none fixed z-50 rounded border border-background-2 bg-backdrop shadow-lg"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        transform:
          position.x > window.innerWidth - 250 ? 'translateX(-100%)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center bg-backdrop px-3 py-1.5">
        <span style={{ color }} className="font-medium">
          {san}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start justify-start gap-1 bg-background-1/80 px-3 py-1.5 text-sm">
        {/* Maia Probability */}
        {maiaProb !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="text-human-3">Maia:</span>
            <span>{(Math.round(maiaProb * 1000) / 10).toFixed(1)}%</span>
          </div>
        )}

        {/* Stockfish Evaluation */}
        {stockfishCp !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="text-engine-3">SF Eval:</span>
            <span>
              {stockfishCp > 0 ? '+' : ''}
              {(stockfishCp / 100).toFixed(2)}
            </span>
          </div>
        )}

        {/* Stockfish Win Rate */}
        {stockfishWinrate !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="text-engine-3">SF Winrate:</span>
            <span>{(stockfishWinrate * 100).toFixed(1)}%</span>
          </div>
        )}

        {/* Stockfish Loss */}
        {stockfishLoss !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="text-engine-3">SF Loss:</span>
            <span>
              {stockfishLoss > 0 ? '+' : ''}
              {stockfishLoss.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
