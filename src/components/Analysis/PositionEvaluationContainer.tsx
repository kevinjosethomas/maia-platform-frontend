import React from 'react'

import { PositionEvaluation } from 'src/types'

interface Props {
  positionEvaluation?: PositionEvaluation
  moveEvaluation: { maia: number; stockfish?: number } | null
}

export const PositionEvaluationContainer: React.FC<Props> = ({
  moveEvaluation,
}: Props) => {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-row gap-1">
        <div className="flex flex-1 items-center justify-between rounded-sm bg-background-1 p-2 text-lg">
          <span className="text-sm text-secondary">Maia eval:</span>{' '}
          <span className="text-sm text-human-2" key={moveEvaluation?.maia}>
            {moveEvaluation ? moveEvaluation.maia.toFixed(3) : '-'}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-sm bg-background-1 p-2 text-lg">
          <span className="text-sm text-secondary">SF eval:</span>{' '}
          <span
            className="text-sm text-engine-3"
            key={moveEvaluation?.stockfish}
          >
            {moveEvaluation?.stockfish
              ? moveEvaluation.stockfish.toFixed(3)
              : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}
