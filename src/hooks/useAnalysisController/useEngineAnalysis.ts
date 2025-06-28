import { Chess } from 'chess.ts'
import { useEffect, useState } from 'react'
import { getBookMoves } from 'src/api'
import { GameNode, MaiaEvaluation, StockfishEvaluation } from 'src/types'
import { MAIA_MODELS } from './constants'

type BatchEvaluateResult = {
  result: MaiaEvaluation[]
  time: number
}

type EngineHooks = {
  maia: {
    batchEvaluate: (
      fens: string[],
      ratingLevels: number[],
      thresholds: number[],
    ) => Promise<BatchEvaluateResult>
  }
  streamEvaluations: (
    fen: string,
    moveCount: number,
  ) => AsyncIterable<StockfishEvaluation> | null
  stopEvaluation: () => void
}

export const useEngineAnalysis = (
  currentNode: GameNode | null,
  inProgressAnalyses: Set<string>,
  maiaStatus: string,
  maia: { batchEvaluate: EngineHooks['maia']['batchEvaluate'] },
  streamEvaluations: EngineHooks['streamEvaluations'],
  stopEvaluation: EngineHooks['stopEvaluation'],
  currentMaiaModel: string,
  setAnalysisState: React.Dispatch<React.SetStateAction<number>>,
) => {
  async function analyze(board: Chess): Promise<{
    [key: string]: MaiaEvaluation
  }> {
    const { result } = await maia.batchEvaluate(
      Array(9).fill(board.fen()),
      [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900],
      [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900],
    )

    const maiaEval: { [key: string]: MaiaEvaluation } = {}
    MAIA_MODELS.forEach((model, index) => {
      maiaEval[model] = result[index]
    })

    return maiaEval
  }

  async function openingBook(board: Chess) {
    const bookMoves = await getBookMoves(board.fen())

    return bookMoves
  }

  useEffect(() => {
    if (!currentNode) return

    const board = new Chess(currentNode.fen)
    const nodeFen = currentNode.fen

    ;(async () => {
      if (
        !currentNode ||
        maiaStatus !== 'ready' ||
        currentNode.analysis.maia ||
        inProgressAnalyses.has(nodeFen)
      )
        return

      inProgressAnalyses.add(nodeFen)

      try {
        if (currentNode.moveNumber <= 5) {
          const [bookMoves, maiaEval] = await Promise.all([
            openingBook(board),
            analyze(board),
          ])

          const analysis: { [key: string]: MaiaEvaluation } = {}
          for (const model of MAIA_MODELS) {
            const policySource = Object.keys(bookMoves[model] || {}).length
              ? bookMoves[model]
              : maiaEval[model].policy

            const sortedPolicy = Object.entries(policySource).sort(
              ([, a], [, b]) => (b as number) - (a as number),
            )

            analysis[model] = {
              value: maiaEval[model].value,
              policy: Object.fromEntries(
                sortedPolicy,
              ) as MaiaEvaluation['policy'],
            }
          }

          currentNode.addMaiaAnalysis(analysis, currentMaiaModel)
          setAnalysisState((state) => state + 1)
          return
        } else {
          const maiaEval = await analyze(board)
          currentNode.addMaiaAnalysis(maiaEval, currentMaiaModel)
          setAnalysisState((state) => state + 1)
        }
      } finally {
        inProgressAnalyses.delete(nodeFen)
      }
    })()
  }, [
    maiaStatus,
    currentNode,
    currentMaiaModel,
    inProgressAnalyses,
    maia,
    setAnalysisState,
  ])

  useEffect(() => {
    if (!currentNode) return
    const board = new Chess(currentNode.fen)
    if (
      currentNode.analysis.stockfish &&
      currentNode.analysis.stockfish?.depth >= 18
    )
      return

    const evaluationStream = streamEvaluations(
      board.fen(),
      board.moves().length,
    )

    if (evaluationStream) {
      ;(async () => {
        for await (const evaluation of evaluationStream) {
          if (!currentNode) {
            stopEvaluation()
            break
          }
          currentNode.addStockfishAnalysis(evaluation, currentMaiaModel)
          setAnalysisState((state) => state + 1)
        }
      })()
    }

    return () => {
      stopEvaluation()
    }
  }, [
    currentNode,
    streamEvaluations,
    stopEvaluation,
    currentMaiaModel,
    setAnalysisState,
  ])
}
