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
      className="pointer-events-none fixed z-50 flex w-auto min-w-[12rem] flex-col overflow-hidden rounded-lg border border-white/30 bg-background-1 backdrop-blur-sm"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        transform:
          position.x > window.innerWidth - 250 ? 'translateX(-100%)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex w-full justify-between border-b border-white/20 bg-gradient-to-r from-background-2/90 to-background-2/70 px-3 py-1.5">
        <span style={{ color }} className="font-medium">
          {san}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start justify-start gap-1 bg-gradient-to-b from-background-1 to-background-1/90 px-3 py-1.5 text-sm">
        {/* Maia Probability */}
        {maiaProb !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="font-medium text-human-2">Maia:</span>
            <span>{(Math.round(maiaProb * 1000) / 10).toFixed(1)}%</span>
          </div>
        )}

        {/* Stockfish Evaluation */}
        {stockfishCp !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="font-medium text-engine-2">SF Eval:</span>
            <span>
              {stockfishCp > 0 ? '+' : ''}
              {(stockfishCp / 100).toFixed(2)}
            </span>
          </div>
        )}

        {/* Stockfish Win Rate */}
        {stockfishWinrate !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="font-medium text-engine-2">SF Winrate:</span>
            <span>{(stockfishWinrate * 100).toFixed(1)}%</span>
          </div>
        )}

        {/* Stockfish Loss */}
        {stockfishLoss !== undefined && (
          <div className="flex w-full items-center justify-between gap-2 font-mono">
            <span className="font-medium text-engine-2">SF Loss:</span>
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
