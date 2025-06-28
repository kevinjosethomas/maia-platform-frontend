import { PieceSymbol } from 'chess.ts'
import type { Key } from 'chessground/types'
import { backOff } from 'exponential-backoff'
import type { DrawShape } from 'chessground/draw'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PlayGameConfig } from 'src/types'
import { useStats } from 'src/hooks/useStats'
import { useChessSound } from 'src/hooks/useChessSound'
import { usePlayController } from './usePlayController'
import { getGameMove, submitGameMove, getPlayPlayerStats } from 'src/api'

const brainStatsLoader = async () => {
  const stats = await getPlayPlayerStats()
  return {
    gamesPlayed: stats.brainGamesPlayed,
    gamesWon: stats.brainWon,
    rating: stats.brainElo,
  }
}

const handStatsLoader = async () => {
  const stats = await getPlayPlayerStats()
  return {
    gamesPlayed: stats.handGamesPlayed,
    gamesWon: stats.handWon,
    rating: stats.handElo,
  }
}

export const useHandBrainController = (
  id: string,
  playGameConfig: PlayGameConfig,
) => {
  const controller = usePlayController(id, playGameConfig)
  const { playSound } = useChessSound()
  const isBrain = playGameConfig.isBrain

  const [selectedPiece, setSelectedPiece] = useState<PieceSymbol | undefined>(
    undefined,
  )

  const [brainMoves, setBrainMoves] = useState<string[]>([])

  const [stats, incrementStats, updateRating] = useStats(
    isBrain ? brainStatsLoader : handStatsLoader,
  )

  const movablePieceTypes = useMemo(() => {
    return new Set(controller.availableMoves.map((m) => m.piece))
  }, [controller.availableMoves])

  const availableMoves = useMemo(() => {
    if (isBrain) {
      return [] // Brain may not make moves directly
    } else if (selectedPiece) {
      return controller.availableMoves.filter((m) => m.piece == selectedPiece)
    } else {
      return []
    }
  }, [isBrain, selectedPiece, controller.availableMoves])

  useEffect(() => {
    if (
      controller.game.id &&
      !isBrain &&
      !selectedPiece &&
      controller.playerActive
    ) {
      // Maia is brain
      let canceled = false

      const maiaChoosePiece = async () => {
        const maiaMoves = await backOff(
          () =>
            getGameMove(
              controller.moveList,
              playGameConfig.maiaPartnerVersion,
              playGameConfig.startFen,
            ),
          {
            jitter: 'full',
          },
        )
        const nextMove = maiaMoves['top_move']

        const pieceType = controller.pieces[nextMove.substring(0, 2)].type

        if (!canceled) {
          setSelectedPiece(pieceType)
          setBrainMoves([...brainMoves, pieceType])
        }
      }

      maiaChoosePiece()
      return () => {
        canceled = true
      }
    }
  }, [
    brainMoves,
    controller.game.id,
    controller.moveList,
    controller.pieces,
    controller.playerActive,
    isBrain,
    playGameConfig.maiaPartnerVersion,
    playGameConfig.startFen,
    selectedPiece,
  ])

  const makePlayerMove = useCallback(
    async (moveUci: string) => {
      controller.updateClock()
      controller.addMove(moveUci)
      setSelectedPiece(undefined)
    },
    [controller],
  )

  useEffect(() => {
    let canceled = false

    const makeMaiaMove = async () => {
      const maiaClock =
        (controller.player == 'white'
          ? controller.blackClock
          : controller.whiteClock) / 1000
      const initialClock = controller.timeControl.includes('+')
        ? parseInt(controller.timeControl.split('+')[0]) * 60
        : 0

      const maiaMoves = await backOff(
        () =>
          getGameMove(
            controller.moveList,
            playGameConfig.maiaVersion,
            playGameConfig.startFen,
            null,
            playGameConfig.simulateMaiaTime ? initialClock : 0,
            playGameConfig.simulateMaiaTime ? maiaClock : 0,
          ),
        {
          jitter: 'full',
        },
      )
      const nextMove = maiaMoves['top_move']
      const moveDelay = maiaMoves['move_delay']

      if (canceled) {
        return
      }

      setTimeout(
        () => {
          const moveTime = controller.updateClock()
          controller.addMoveWithTime(nextMove, moveTime)
          playSound(false)
        },
        playGameConfig.simulateMaiaTime ? moveDelay * 1000 : 0,
      )
    }

    if (
      controller.game.id &&
      !controller.playerActive &&
      !controller.game.termination
    ) {
      makeMaiaMove()
      return () => {
        canceled = true
      }
    }
  }, [
    controller.playerActive,
    controller.moveList,
    controller,
    playGameConfig.maiaVersion,
    playGameConfig.startFen,
    playGameConfig.simulateMaiaTime,
    playSound,
  ])

  const selectPiece = useCallback(
    async (piece: PieceSymbol) => {
      if (movablePieceTypes.has(piece)) {
        setSelectedPiece(piece)
        setBrainMoves([...brainMoves, piece])

        const maiaMoves = await backOff(
          () =>
            getGameMove(
              controller.moveList,
              playGameConfig.maiaPartnerVersion,
              playGameConfig.startFen,
              piece,
            ),
          {
            jitter: 'full',
          },
        )
        const nextMove = maiaMoves['top_move']
        makePlayerMove(nextMove)
        playSound(false)
      }
    },
    [
      controller.moveList,
      makePlayerMove,
      movablePieceTypes,
      playGameConfig.maiaPartnerVersion,
      playGameConfig.startFen,
      brainMoves,
      playSound,
    ],
  )

  const boardShapes: DrawShape[] = useMemo(() => {
    if (!isBrain && selectedPiece) {
      return Object.entries(controller.pieces)
        .filter(([, piece]) => piece.color == controller.player.substring(0, 1))
        .filter(([, piece]) => selectedPiece == piece.type)
        .map(([square]) => {
          return {
            orig: square as Key,
            brush: 'green',
          }
        })
    } else {
      return []
    }
  }, [isBrain, selectedPiece, controller.pieces, controller.player])

  const reset = () => {
    setSelectedPiece(undefined)
    setBrainMoves([])
    controller.reset()
  }

  useEffect(() => {
    const gameOverState = controller.game.termination?.type || 'not_over'

    if (controller.moveList.length == 0 && gameOverState == 'not_over') {
      return
    }

    const winner = controller.game.termination?.winner

    const submitFn = async () => {
      const response = await backOff(
        () =>
          submitGameMove(
            controller.game.id,
            controller.moveList,
            controller.moveTimes,
            gameOverState,
            playGameConfig.isBrain ? 'brain' : 'hand',
            playGameConfig.startFen || undefined,
            winner,
            brainMoves,
          ),
        {
          jitter: 'full',
        },
      )
      if (controller.game.termination) {
        const winner = controller.game.termination?.winner

        updateRating(response.player_elo)
        incrementStats(1, winner == playGameConfig.player ? 1 : 0)
      }
    }
    submitFn()
  }, [
    controller.game.id,
    controller.moveList,
    controller.game.termination,
    controller.moveTimes,
    playGameConfig.startFen,
    playGameConfig.isBrain,
    brainMoves,
    playGameConfig.player,
    incrementStats,
    updateRating,
  ])

  return {
    ...controller,
    availableMoves,
    makeMove: makePlayerMove,
    boardShapes,
    selectedPiece,
    movablePieceTypes,
    selectPiece,
    reset,
    stats,
  }
}
