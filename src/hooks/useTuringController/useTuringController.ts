import { useRouter } from 'next/router'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { Chess } from 'chess.ts'

import { useStats } from '../useStats'
import { Color, GameTree } from 'src/types'
import { TuringGame } from 'src/types/turing'
import { useTreeController } from '../useTreeController'
import { getTuringGame, getTuringPlayerStats, submitTuringGuess } from 'src/api'

const statsLoader = async () => {
  const stats = await getTuringPlayerStats()
  return {
    gamesPlayed: stats.correctGuesses + stats.wrongGuesses,
    gamesWon: stats.correctGuesses,
    rating: stats.rating,
  }
}

const buildTuringGameTree = (game: TuringGame): GameTree => {
  if (!game.moves || game.moves.length === 0) {
    return new GameTree(new Chess().fen())
  }

  const initialFen = game.moves[0].board
  const tree = new GameTree(initialFen)
  let currentNode = tree.getRoot()

  for (let i = 1; i < game.moves.length; i++) {
    const move = game.moves[i]
    const uci = move.uci || (move.lastMove ? move.lastMove.join('') : undefined)
    if (uci && move.san) {
      currentNode = tree.addMainMove(currentNode, move.board, uci, move.san)
    }
  }

  return tree
}

export const useTuringController = () => {
  const router = useRouter()
  const [turingGames, setTuringGames] = useState<{ [id: string]: TuringGame }>(
    {},
  )

  const [loading, setLoading] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<string>('')
  const [stats, incrementStats, updateRating] = useStats(statsLoader)

  const getNewGame = useCallback(async () => {
    setLoading(true)
    let game
    try {
      game = await getTuringGame()
    } catch (e) {
      router.push('/401')
      return
    }

    setLoading(false)
    setTuringGames({ ...turingGames, [game.id]: game })
    setCurrentGameId(game.id)
  }, [turingGames, router])

  useEffect(() => {
    if (Object.keys(turingGames).length === 0) getNewGame()
  }, [getNewGame, turingGames])

  const game = useMemo(
    () => turingGames[currentGameId ?? ''],
    [turingGames, currentGameId],
  )

  const gameTree = useMemo(() => {
    if (!game) return new GameTree(new Chess().fen())
    return buildTuringGameTree(game)
  }, [game])

  const controller = useTreeController(gameTree, 'white')

  useEffect(() => {
    if (gameTree && game) {
      const mainLine = gameTree.getMainLine()
      controller.setCurrentNode(mainLine[mainLine.length - 1])
    }
  }, [game])

  const gameIds = useMemo(() => Object.keys(turingGames), [turingGames])

  const submitGuess = useCallback(
    async (guess: Color, comment = '', rating?: number) => {
      if (game && !game.result) {
        const result = await submitTuringGuess(game.id, guess, comment)
        setTuringGames({
          ...turingGames,
          [game.id]: {
            ...game,
            result: { ...result, ratingDiff: result.turingElo - (rating || 0) },
          },
        })
        commentController[1]('')

        updateRating(result.turingElo)
        incrementStats(1, result.correct ? 1 : 0)
      }
    },
    [game, incrementStats, turingGames, updateRating],
  )

  const commentController = useState('')

  return {
    gameTree,
    currentNode: controller.currentNode,
    goToNode: controller.goToNode,
    goToNextNode: controller.goToNextNode,
    goToPreviousNode: controller.goToPreviousNode,
    goToRootNode: controller.goToRootNode,
    plyCount: controller.plyCount,
    orientation: controller.orientation,
    setOrientation: controller.setOrientation,

    game: game as TuringGame | undefined,
    games: turingGames,
    getNewGame,
    loading,
    gameIds,
    currentGameId,
    setCurrentGameId,
    submitGuess,
    commentController,
    stats,
  }
}
