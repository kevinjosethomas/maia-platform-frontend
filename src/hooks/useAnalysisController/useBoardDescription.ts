import { useMemo } from 'react'
import {
  BlunderMeterResult,
  GameNode,
  MaiaEvaluation,
  StockfishEvaluation,
} from 'src/types'
import { MAIA_MODELS } from './constants'
import { describePosition } from './useDescriptionGenerator'

type ColorSanMapping = {
  [move: string]: {
    san: string
    color: string
  }
}

export const useBoardDescription = (
  currentNode: GameNode | null,
  moveEvaluation: {
    maia?: MaiaEvaluation
    stockfish?: StockfishEvaluation
  } | null,
  blunderMeter: BlunderMeterResult,
  colorSanMapping: ColorSanMapping,
) => {
  return useMemo(() => {
    if (
      !currentNode ||
      !moveEvaluation?.stockfish ||
      !moveEvaluation?.maia ||
      moveEvaluation.stockfish.depth < 12
    ) {
      return ''
    }

    const fen = currentNode.fen
    const whiteToMove = currentNode.turn === 'w'

    const stockfishEvals = moveEvaluation.stockfish.cp_vec
    const maiaEvals: Record<string, number[]> = {}
    const allMaiaAnalysis = currentNode.analysis.maia || {}

    Object.keys(moveEvaluation.maia.policy).forEach((move) => {
      maiaEvals[move] = new Array(MAIA_MODELS.length).fill(0)
    })

    MAIA_MODELS.forEach((model, index) => {
      const modelAnalysis = allMaiaAnalysis[model]
      if (modelAnalysis?.policy) {
        Object.entries(modelAnalysis.policy).forEach(([move, probability]) => {
          if (!maiaEvals[move]) {
            maiaEvals[move] = new Array(MAIA_MODELS.length).fill(0)
          }
          maiaEvals[move][index] = probability
        })
      }
    })

    return describePosition(fen, stockfishEvals, maiaEvals, whiteToMove)
  }, [currentNode, moveEvaluation])
}
