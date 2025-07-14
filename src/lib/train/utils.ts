import { Chess } from 'chess.ts'
import { TrainingGame } from 'src/types/training'
import {
  GameNode,
  AnalyzedGame,
  MaiaEvaluation,
  StockfishEvaluation,
} from 'src/types'

/**
 * Helper function to convert TrainingGame to AnalyzedGame
 */
export const convertTrainingGameToAnalyzedGame = (
  trainingGame: TrainingGame,
): AnalyzedGame => {
  const maiaEvaluations: { [rating: string]: MaiaEvaluation }[] = []
  const stockfishEvaluations: (StockfishEvaluation | undefined)[] = []
  const availableMoves = []

  for (let i = 0; i < trainingGame.moves.length; i++) {
    maiaEvaluations.push({})
    stockfishEvaluations.push(undefined)
    availableMoves.push({})
  }

  return {
    ...trainingGame,
    maiaEvaluations,
    stockfishEvaluations,
    availableMoves,
    type: 'play' as const,
  }
}

/**
 * Get the current player for promotion overlay
 */
export const getCurrentPlayer = (currentNode: GameNode): 'white' | 'black' => {
  if (!currentNode) return 'white'
  const chess = new Chess(currentNode.fen)
  return chess.turn() === 'w' ? 'white' : 'black'
}

/**
 * Get available moves from controller for promotion detection
 */
export const getAvailableMovesArray = (movesMap: Map<string, string[]>) => {
  return Array.from(movesMap.entries()).flatMap(([from, tos]) =>
    tos.map((to) => ({ from, to })),
  )
}

/**
 * Check if a move requires promotion (multiple matching moves)
 */
export const requiresPromotion = (
  playedMove: [string, string],
  availableMoves: { from: string; to: string }[],
): boolean => {
  const matching = availableMoves.filter((m) => {
    return m.from === playedMove[0] && m.to === playedMove[1]
  })
  return matching.length > 1
}
