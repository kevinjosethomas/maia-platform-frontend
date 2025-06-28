import { useMemo } from 'react'
import { Chess } from 'chess.ts'
import { GameNode, MaiaEvaluation, StockfishEvaluation } from 'src/types'
import { MAIA_MODELS } from './constants'

export const useMoveRecommendations = (
  currentNode: GameNode | null,
  moveEvaluation: {
    maia?: MaiaEvaluation
    stockfish?: StockfishEvaluation
  } | null,
  currentMaiaModel: string,
) => {
  const recommendations = useMemo(() => {
    if (!moveEvaluation) return {}

    const isBlackTurn = currentNode?.turn === 'b'

    const result: {
      maia?: { move: string; prob: number }[]
      stockfish?: {
        move: string
        cp: number
        winrate?: number
        winrate_loss?: number
      }[]
      isBlackTurn?: boolean
    } = {
      isBlackTurn,
    }

    if (moveEvaluation?.maia) {
      const policy = moveEvaluation.maia.policy
      const maia = Object.entries(policy).map(([move, prob]) => ({
        move,
        prob,
      }))

      result.maia = maia
    }

    if (moveEvaluation?.stockfish) {
      const cp_vec = moveEvaluation.stockfish.cp_vec
      const winrate_vec = moveEvaluation.stockfish.winrate_vec || {}
      const winrate_loss_vec = moveEvaluation.stockfish.winrate_loss_vec || {}

      const stockfish = Object.entries(cp_vec).map(([move, cp]) => ({
        move,
        cp,
        winrate: winrate_vec[move] || 0,
        winrate_loss: winrate_loss_vec[move] || 0,
      }))

      result.stockfish = stockfish
    }

    return result
  }, [moveEvaluation, currentNode])

  const movesByRating = useMemo(() => {
    if (!currentNode) return
    const maia = currentNode.analysis.maia
    const stockfish = moveEvaluation?.stockfish
    const candidates: string[][] = []

    if (!maia) return

    // Get top 3 Maia moves from selected rating level
    for (const move of Object.keys(maia[currentMaiaModel].policy).slice(0, 3)) {
      if (candidates.find((c) => c[0] === move)) continue
      candidates.push([move, move])
    }

    // Get top 3 Stockfish moves
    if (stockfish) {
      for (const move of Object.keys(stockfish.cp_vec).slice(0, 3)) {
        if (candidates.find((c) => c[0] === move)) continue
        candidates.push([move, move])
      }
    }

    // Get top Maia move from each rating level
    for (const rating of MAIA_MODELS) {
      const move = Object.keys(maia[rating].policy)[0]
      if (candidates.find((c) => c[0] === move)) continue
      candidates.push([move, move])
    }

    const data = []
    for (const rating of MAIA_MODELS) {
      const entry: { [key: string]: number } = {
        rating: parseInt(rating.slice(-4)),
      }

      for (const move of candidates) {
        const probability = maia[rating].policy[move[0]] * 100
        entry[move[1]] = probability
      }

      data.push(entry)
    }

    return data
  }, [currentMaiaModel, moveEvaluation, currentNode])

  const moveMap = useMemo(() => {
    if (!moveEvaluation?.maia || !moveEvaluation?.stockfish || !currentNode) {
      return
    }

    // Get ALL legal moves from the current position
    const chess = new Chess(currentNode.fen)
    const legalMoves = chess.moves({ verbose: true })

    // Create a set of all legal moves in UCI format
    const allLegalMoves = new Set(
      legalMoves.map((move) => `${move.from}${move.to}${move.promotion || ''}`),
    )

    const data = []

    // Include all legal moves, not just top ones
    for (const move of allLegalMoves) {
      // Get Stockfish evaluation (default to worst possible if not evaluated)
      const cp =
        moveEvaluation.stockfish.cp_relative_vec[move] !== undefined
          ? Math.max(-4, moveEvaluation.stockfish.cp_relative_vec[move] / 100)
          : -4 // Worst possible Stockfish evaluation

      // Get Maia probability (default to 0 if not in policy)
      const prob = (moveEvaluation.maia.policy[move] || 0) * 100

      // Calculate opacity based on position quality
      // Moves in bottom-left (worse SF, less likely Maia) should be more transparent
      // Normalize values: cp ranges from -4 to 0, prob ranges from 0 to ~100
      const normalizedCp = (cp + 4) / 4 // 0 to 1 (0 = worst, 1 = best)
      const normalizedProb = Math.min(prob / 50, 1) // 0 to 1 (capped at 50% for normalization)

      // Combine both factors for opacity (minimum 0.2 for visibility, maximum 1.0)
      const opacity = Math.max(
        0.2,
        Math.min(1.0, (normalizedCp + normalizedProb) / 2),
      )

      // Calculate importance score for sorting (higher = more important)
      // This combines normalized Stockfish evaluation and Maia probability
      const importance = normalizedCp + normalizedProb

      // Calculate dynamic size based on importance (bigger = more important)
      // Increased size range from 4-12 to 6-16 for better visibility
      const size = Math.max(6, Math.min(16, 6 + importance * 6)) // 6-16px range

      // Get additional data for comprehensive tooltip
      const rawCp = moveEvaluation.stockfish.cp_vec[move] || 0
      const winrate = moveEvaluation.stockfish.winrate_vec?.[move] || 0
      const rawMaiaProb = moveEvaluation.maia.policy[move] || 0

      data.push({
        move,
        x: cp,
        y: prob,
        opacity,
        importance,
        size,
        // Additional data for tooltip
        rawCp,
        winrate,
        rawMaiaProb,
        relativeCp: cp,
      })
    }

    // Sort by importance (ascending) so more important moves are rendered last (on top)
    return data.sort((a, b) => a.importance - b.importance)
  }, [moveEvaluation, currentNode])

  return {
    recommendations,
    movesByRating,
    moveMap,
  }
}
