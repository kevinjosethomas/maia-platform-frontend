import { Chess } from 'chess.ts'
import { GameTree } from 'src/types'
import { TrainingGame } from 'src/types/training'
import { useMemo, useCallback, useEffect } from 'react'
import { useTreeController } from '../useTreeController'

const buildTrainingGameTree = (game: TrainingGame): GameTree => {
  if (!game.moves || game.moves.length === 0) {
    return new GameTree(new Chess().fen())
  }

  const initialFen = game.moves[0].board
  const tree = new GameTree(initialFen)
  let currentNode = tree.getRoot()

  for (let i = 1; i < game.moves.length; i++) {
    const move = game.moves[i]
    if (move.uci && move.san) {
      currentNode = tree.addMainMove(
        currentNode,
        move.board,
        move.uci,
        move.san,
      )
    }
  }

  return tree
}

export const useTrainingController = (game: TrainingGame) => {
  const gameTree = useMemo(() => buildTrainingGameTree(game), [game])
  const initialOrientation = useMemo(() => {
    const puzzleFen = game.moves[game.targetIndex].board
    const chess = new Chess(puzzleFen)
    return chess.turn() === 'w' ? 'white' : 'black'
  }, [game.targetIndex, game.moves])
  const controller = useTreeController(gameTree, initialOrientation)

  const puzzleStartingNode = useMemo(() => {
    let node = gameTree.getRoot()
    for (let i = 1; i <= game.targetIndex; i++) {
      if (node.mainChild) {
        node = node.mainChild
      } else {
        break
      }
    }
    return node
  }, [gameTree, game.targetIndex])

  useEffect(() => {
    controller.goToNode(puzzleStartingNode)
  }, [game.id])

  const availableMovesMapped = useMemo(() => {
    const moveMap = new Map<string, string[]>()
    const currentFen = controller.currentNode.fen

    if (currentFen === puzzleStartingNode.fen) {
      const chess = new Chess(currentFen)
      const legalMoves = chess.moves({ verbose: true })

      legalMoves.forEach((move) => {
        const from = move.from
        const to = move.to
        moveMap.set(from, (moveMap.get(from) ?? []).concat([to]))
      })
    }

    return moveMap
  }, [controller.currentNode, puzzleStartingNode])

  const onPlayerGuess = useCallback(
    (moveUci: string) => {
      const newNode = controller.gameTree.addMoveToMainLine(moveUci)
      if (newNode) {
        controller.setCurrentNode(newNode)
      }
    },
    [controller],
  )

  const reset = useCallback(() => {
    puzzleStartingNode.removeAllChildren()
    controller.goToNode(puzzleStartingNode)
  }, [controller, puzzleStartingNode])

  return {
    reset,
    onPlayerGuess,
    availableMovesMapped,
    puzzleStartingNode,

    gameTree: controller.gameTree,
    currentNode: controller.currentNode,
    setCurrentNode: controller.setCurrentNode,
    goToNode: controller.goToNode,
    goToNextNode: controller.goToNextNode,
    goToPreviousNode: controller.goToPreviousNode,
    goToRootNode: controller.goToRootNode,
    plyCount: controller.plyCount,
    orientation: controller.orientation,
    setOrientation: controller.setOrientation,
  }
}
