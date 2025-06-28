import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Chess, PieceSymbol } from 'chess.ts'
import { getGameMove } from 'src/api/play/play'
import { useTreeController } from '../useTreeController'
import { useChessSound } from '../useChessSound'
import { useStockfishEngine } from '../useStockfishEngine'
import { useMaiaEngine } from '../useMaiaEngine'
import { GameTree, GameNode } from 'src/types'
import {
  OpeningSelection,
  OpeningDrillGame,
  CompletedDrill,
  DrillPerformanceData,
  OverallPerformanceData,
  DrillConfiguration,
} from 'src/types/openings'
import { analyzeDrillPerformance } from 'src/utils/openings/drillAnalysis'

// Helper function to parse PGN and create moves in the tree
const parsePgnToTree = (pgn: string, gameTree: GameTree): GameNode | null => {
  if (!pgn || pgn.trim() === '') return gameTree.getRoot()

  const chess = new Chess()
  let currentNode = gameTree.getRoot()

  // Remove move numbers and extra spaces, split by spaces
  const moveText = pgn.replace(/\d+\./g, '').trim()
  const moves = moveText.split(/\s+/).filter((move) => move && move !== '')

  for (const moveStr of moves) {
    try {
      const moveObj = chess.move(moveStr)
      if (!moveObj) break

      const moveUci = moveObj.from + moveObj.to + (moveObj.promotion || '')

      // Check if this move already exists as a child
      const existingChild = currentNode.children.find(
        (child: GameNode) => child.move === moveUci,
      )

      if (existingChild) {
        currentNode = existingChild
      } else {
        // Add move as main child
        const newNode = gameTree.addMainMove(
          currentNode,
          chess.fen(),
          moveUci,
          moveObj.san,
        )
        if (newNode) {
          currentNode = newNode
        } else {
          break
        }
      }
    } catch (error) {
      console.error('Error parsing move:', moveStr, error)
      break
    }
  }

  return currentNode
}

// Helper function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const useOpeningDrillController = (
  configuration: DrillConfiguration,
) => {
  // Drilling state
  const [remainingDrills, setRemainingDrills] = useState<OpeningSelection[]>([])
  const [currentDrill, setCurrentDrill] = useState<OpeningSelection | null>(
    null,
  )
  const [completedDrills, setCompletedDrills] = useState<CompletedDrill[]>([])
  const [currentDrillGame, setCurrentDrillGame] =
    useState<OpeningDrillGame | null>(null)
  const [analysisEnabled, setAnalysisEnabled] = useState(false)
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0)
  const [allDrillsCompleted, setAllDrillsCompleted] = useState(false)

  // Performance tracking state
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showFinalModal, setShowFinalModal] = useState(false)
  const [currentPerformanceData, setCurrentPerformanceData] =
    useState<DrillPerformanceData | null>(null)
  const [isAnalyzingDrill, setIsAnalyzingDrill] = useState(false)

  // Flag to track when we're waiting for Maia's response (to prevent navigation-triggered moves)
  const [waitingForMaiaResponse, setWaitingForMaiaResponse] = useState(false)

  // Flag to track if player chose to continue analyzing past the target move count
  const [continueAnalyzingMode, setContinueAnalyzingMode] = useState(false)

  // Add chess sound hook
  const { playSound } = useChessSound()

  // Add engine hooks for analysis
  const { streamEvaluations } = useStockfishEngine()
  const { maia } = useMaiaEngine()

  // Initialize drilling session from configuration
  useEffect(() => {
    if (
      configuration.drillSequence.length > 0 &&
      remainingDrills.length === 0 &&
      !allDrillsCompleted
    ) {
      setRemainingDrills(configuration.drillSequence)
      setCurrentDrill(configuration.drillSequence[0])
      setCurrentDrillIndex(0)
    }
  }, [configuration.drillSequence, remainingDrills.length, allDrillsCompleted])

  // Initialize current drill game when drill changes
  useEffect(() => {
    if (!currentDrill || allDrillsCompleted) return

    const startingFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const gameTree = new GameTree(startingFen)

    // Parse the PGN to populate the tree with opening moves
    const pgn = currentDrill.variation
      ? currentDrill.variation.pgn
      : currentDrill.opening.pgn
    const endNode = parsePgnToTree(pgn, gameTree)

    const drillGame: OpeningDrillGame = {
      id: currentDrill.id,
      selection: currentDrill,
      moves: [],
      tree: gameTree,
      currentFen: endNode?.fen || startingFen,
      toPlay: endNode
        ? new Chess(endNode.fen).turn() === 'w'
          ? 'white'
          : 'black'
        : 'white',
      openingEndNode: endNode,
      playerMoveCount: 0,
    }

    setCurrentDrillGame(drillGame)
    setWaitingForMaiaResponse(false)
    setContinueAnalyzingMode(false) // Reset continue analyzing mode for new drill
  }, [currentDrill, allDrillsCompleted])

  // Use the current drill game's tree, or create a default one
  const gameTree = currentDrillGame?.tree || new GameTree(new Chess().fen())
  const controller = useTreeController(
    gameTree,
    currentDrill?.playerColor || 'white',
  )

  // Sync the controller's current node with the drill game state
  useEffect(() => {
    if (currentDrillGame && currentDrillGame.moves.length === 0) {
      if (currentDrillGame.openingEndNode) {
        controller.setCurrentNode(currentDrillGame.openingEndNode)
      } else if (currentDrillGame.tree) {
        controller.setCurrentNode(currentDrillGame.tree.getRoot())
      }
    }
  }, [currentDrillGame?.id, controller])

  // Set board orientation based on player color
  useEffect(() => {
    if (currentDrill?.playerColor) {
      controller.setOrientation(currentDrill.playerColor)
    }
  }, [currentDrill?.playerColor, controller])

  // Determine if it's the player's turn
  const isPlayerTurn = useMemo(() => {
    if (!currentDrillGame || !controller.currentNode) return true
    const chess = new Chess(controller.currentNode.fen)
    const currentTurn = chess.turn() === 'w' ? 'white' : 'black'
    return currentTurn === currentDrill?.playerColor
  }, [currentDrillGame, controller.currentNode, currentDrill?.playerColor])

  // Check if drill is complete (reached target move count and not in continue analyzing mode)
  const isDrillComplete = useMemo(() => {
    if (!currentDrillGame || !currentDrill) return false
    return (
      currentDrillGame.playerMoveCount >= currentDrill.targetMoveNumber &&
      !continueAnalyzingMode
    )
  }, [currentDrillGame, currentDrill, continueAnalyzingMode])

  // Check if we're at the opening end position (can't go further back)
  const isAtOpeningEnd = useMemo(() => {
    if (!currentDrillGame || !controller.currentNode) return false
    return controller.currentNode === currentDrillGame.openingEndNode
  }, [currentDrillGame, controller.currentNode])

  // Check if all drills are completed
  const areAllDrillsCompleted = useMemo(() => {
    return (
      allDrillsCompleted || completedDrills.length >= configuration.drillCount
    )
  }, [allDrillsCompleted, completedDrills.length, configuration.drillCount])

  // Available moves for the current position - only when it's the player's turn
  const moves = useMemo(() => {
    if (!controller.currentNode || !isPlayerTurn)
      return new Map<string, string[]>()

    const moveMap = new Map<string, string[]>()
    const chess = new Chess(controller.currentNode.fen)
    const legalMoves = chess.moves({ verbose: true })

    legalMoves.forEach((move) => {
      const { from, to } = move
      moveMap.set(from, (moveMap.get(from) ?? []).concat([to]))
    })

    return moveMap
  }, [controller.currentNode, isPlayerTurn])

  // Function to evaluate drill performance using comprehensive analysis
  const evaluateDrillPerformance = useCallback(
    async (drillGame: OpeningDrillGame): Promise<DrillPerformanceData> => {
      const finalNode = controller.currentNode || drillGame.tree.getRoot()

      try {
        // Use comprehensive analysis if engines are available
        if (maia && streamEvaluations) {
          return await analyzeDrillPerformance(
            drillGame,
            finalNode,
            streamEvaluations,
            maia,
          )
        }
      } catch (error) {
        console.error(
          'Error in comprehensive analysis, falling back to basic:',
          error,
        )
      }

      // Fallback to basic analysis if engines not available
      const { selection, playerMoveCount } = drillGame
      const goodMoves = Math.floor(playerMoveCount * 0.7)
      const blunders = Math.max(
        0,
        playerMoveCount - goodMoves - Math.floor(playerMoveCount * 0.2),
      )
      const accuracy =
        playerMoveCount > 0 ? (goodMoves / playerMoveCount) * 100 : 100

      const completedDrill: CompletedDrill = {
        selection,
        finalNode,
        playerMoves: drillGame.moves.filter((_, index) => {
          const isPlayerMove =
            selection.playerColor === 'white'
              ? index % 2 === 0
              : index % 2 === 1
          return isPlayerMove
        }),
        allMoves: drillGame.moves,
        totalMoves: playerMoveCount,
        blunders: Array(blunders).fill('placeholder'),
        goodMoves: Array(goodMoves).fill('placeholder'),
        finalEvaluation: 0,
        completedAt: new Date(),
      }

      const feedback = [
        'Analysis temporarily unavailable. Basic feedback provided.',
      ]
      if (accuracy >= 90) {
        feedback.push('Excellent performance! You played very accurately.')
      } else if (accuracy >= 70) {
        feedback.push('Good job! Most of your moves were strong.')
      } else {
        feedback.push('This opening needs more practice.')
      }

      return {
        drill: completedDrill,
        evaluationChart: [],
        accuracy,
        blunderCount: blunders,
        goodMoveCount: goodMoves,
        inaccuracyCount: 0,
        mistakeCount: 0,
        excellentMoveCount: 0,
        feedback,
        moveAnalyses: [],
        ratingComparison: [],
        bestPlayerMoves: [],
        worstPlayerMoves: [],
        averageEvaluationLoss: 0,
        openingKnowledge: 75,
      }
    },
    [controller.currentNode, maia, streamEvaluations],
  )

  // Complete current drill and show performance modal
  const completeDrill = useCallback(
    async (gameToComplete?: OpeningDrillGame) => {
      const drillGame = gameToComplete || currentDrillGame
      if (!drillGame) return

      try {
        setIsAnalyzingDrill(true) // Show loading state
        const performanceData = await evaluateDrillPerformance(drillGame)
        setCurrentPerformanceData(performanceData)

        // Check if this drill already exists in completedDrills and update it instead of adding new
        setCompletedDrills((prev) => {
          const existingIndex = prev.findIndex(
            (completedDrill) =>
              completedDrill.selection.id === drillGame.selection.id,
          )

          if (existingIndex !== -1) {
            // Update existing drill
            const updated = [...prev]
            updated[existingIndex] = performanceData.drill
            return updated
          } else {
            // Add new drill
            return [...prev, performanceData.drill]
          }
        })

        // Don't remove from remaining drills here - do it in moveToNextDrill
        // This ensures proper counting for the performance modal
        setShowPerformanceModal(true)
      } catch (error) {
        console.error('Error completing drill analysis:', error)
        // Still show modal even if analysis fails
        setShowPerformanceModal(true)
      } finally {
        setIsAnalyzingDrill(false) // Turn off loading state
      }
    },
    [currentDrillGame, evaluateDrillPerformance],
  )

  // Move to next drill
  const moveToNextDrill = useCallback(() => {
    setShowPerformanceModal(false)
    setCurrentPerformanceData(null)
    setContinueAnalyzingMode(false) // Reset continue analyzing mode for next drill

    // Remove the completed drill from remaining drills
    setRemainingDrills((prev) => prev.slice(1))

    const nextIndex = currentDrillIndex + 1

    // Check if there are more drills to complete
    if (nextIndex < configuration.drillSequence.length) {
      setCurrentDrill(configuration.drillSequence[nextIndex])
      setCurrentDrillIndex(nextIndex)
    } else {
      // All drills completed - show final modal
      setAllDrillsCompleted(true)
      setShowFinalModal(true)
    }
  }, [currentDrillIndex, configuration.drillSequence])

  // Continue analyzing current drill
  const continueAnalyzing = useCallback(() => {
    setShowPerformanceModal(false)
    setAnalysisEnabled(true) // Auto-enable analysis
    setContinueAnalyzingMode(true) // Allow moves beyond target count
  }, [])

  // Continue analyzing from final modal - just enable analysis mode
  const continueAnalyzingFromFinal = useCallback(() => {
    setShowFinalModal(false)
    setAnalysisEnabled(true) // Auto-enable analysis
    setContinueAnalyzingMode(true) // Allow moves beyond target count
  }, [])

  // Show final summary modal
  const showSummary = useCallback(() => {
    setShowFinalModal(true)
  }, [])

  // Reset drill session for new openings
  const resetDrillSession = useCallback(() => {
    setAllDrillsCompleted(false)
    setRemainingDrills([])
    setCompletedDrills([])
    setCurrentDrill(null)
    setCurrentDrillGame(null)
    setCurrentDrillIndex(0)
    setAnalysisEnabled(false)
    setContinueAnalyzingMode(false)
    setShowPerformanceModal(false)
    setShowFinalModal(false)
    setCurrentPerformanceData(null)
    setWaitingForMaiaResponse(false)
  }, [])

  // Load a specific completed drill for analysis
  const loadCompletedDrill = useCallback(
    (completedDrill: CompletedDrill) => {
      // Set the drill as current
      setCurrentDrill(completedDrill.selection)

      // Check if this drill is already the current drill and we can reuse the game tree
      if (
        currentDrillGame &&
        currentDrillGame.selection.id === completedDrill.selection.id &&
        currentDrillGame.playerMoveCount === completedDrill.totalMoves
      ) {
        // Reuse the existing game tree and just enable analysis mode
        setAnalysisEnabled(true)
        setContinueAnalyzingMode(true)
        setWaitingForMaiaResponse(false)
        return
      }

      // Try to reconstruct the game tree from the finalNode path
      const startingFen =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const gameTree = new GameTree(startingFen)

      // Parse the PGN to populate the tree with opening moves
      const pgn = completedDrill.selection.variation
        ? completedDrill.selection.variation.pgn
        : completedDrill.selection.opening.pgn
      const endNode = parsePgnToTree(pgn, gameTree)

      let finalNode = endNode

      // Reconstruct the full game using the stored allMoves sequence
      if (
        endNode &&
        completedDrill.allMoves &&
        completedDrill.allMoves.length > 0
      ) {
        let currentNode = endNode
        const chess = new Chess(endNode.fen)

        // Replay all moves from the drill (both player and Maia moves)
        for (const moveUci of completedDrill.allMoves) {
          try {
            const moveObj = chess.move(moveUci, { sloppy: true })
            if (moveObj) {
              const newNode = gameTree.addMainMove(
                currentNode,
                chess.fen(),
                moveUci,
                moveObj.san,
              )
              if (newNode) {
                currentNode = newNode
                finalNode = newNode
              }
            }
          } catch (error) {
            console.error('Error replaying move:', moveUci, error)
            break
          }
        }
      } else if (endNode && completedDrill.playerMoves.length > 0) {
        // Fallback: use only player moves if allMoves is not available
        let currentNode = endNode
        const chess = new Chess(endNode.fen)

        for (const moveUci of completedDrill.playerMoves) {
          try {
            const moveObj = chess.move(moveUci, { sloppy: true })
            if (moveObj) {
              const newNode = gameTree.addMainMove(
                currentNode,
                chess.fen(),
                moveUci,
                moveObj.san,
              )
              if (newNode) {
                currentNode = newNode
                finalNode = newNode
              }
            }
          } catch (error) {
            console.error('Error replaying player move:', moveUci, error)
            break
          }
        }
      }

      const loadedGame: OpeningDrillGame = {
        id: completedDrill.selection.id + '-replay',
        selection: completedDrill.selection,
        moves: completedDrill.allMoves || completedDrill.playerMoves,
        tree: gameTree,
        currentFen: finalNode?.fen || endNode?.fen || startingFen,
        toPlay: finalNode
          ? new Chess(finalNode.fen).turn() === 'w'
            ? 'white'
            : 'black'
          : 'white',
        openingEndNode: endNode,
        playerMoveCount: completedDrill.totalMoves,
      }

      // Important: Set the loaded game state first before setting controller position
      // This ensures the useEffect hooks see the correct moves.length > 0 state
      setCurrentDrillGame(loadedGame)
      setAnalysisEnabled(true) // Auto-enable analysis when loading a completed drill
      setContinueAnalyzingMode(true) // Allow moves beyond target count

      // Check if it's Maia's turn after loading and set waiting flag accordingly
      const isMaiaTurn = finalNode
        ? new Chess(finalNode.fen).turn() !==
          (completedDrill.selection.playerColor === 'white' ? 'w' : 'b')
        : false

      setWaitingForMaiaResponse(isMaiaTurn) // Set to true if it's Maia's turn, false otherwise

      // Set the controller to the final position after ensuring game state is set
      setTimeout(() => {
        if (finalNode) {
          controller.setCurrentNode(finalNode)
        }
      }, 50) // Shorter delay to ensure state is synchronized
    },
    [controller, currentDrillGame],
  )

  // Calculate overall performance data
  const overallPerformanceData = useMemo((): OverallPerformanceData => {
    if (completedDrills.length === 0) {
      return {
        totalDrills: configuration.drillCount,
        completedDrills: [],
        overallAccuracy: 0,
        totalBlunders: 0,
        totalGoodMoves: 0,
        bestPerformance: null,
        worstPerformance: null,
        averageEvaluation: 0,
      }
    }

    const totalGoodMoves = completedDrills.reduce(
      (sum, drill) => sum + drill.goodMoves.length,
      0,
    )
    const totalMoves = completedDrills.reduce(
      (sum, drill) => sum + drill.totalMoves,
      0,
    )
    const overallAccuracy =
      totalMoves > 0 ? (totalGoodMoves / totalMoves) * 100 : 0
    const totalBlunders = completedDrills.reduce(
      (sum, drill) => sum + drill.blunders.length,
      0,
    )
    const averageEvaluation =
      completedDrills.reduce((sum, drill) => sum + drill.finalEvaluation, 0) /
      completedDrills.length

    const bestPerformance = completedDrills.reduce((best, drill) => {
      const accuracy =
        drill.totalMoves > 0
          ? (drill.goodMoves.length / drill.totalMoves) * 100
          : 0
      const bestAccuracy =
        best && best.totalMoves > 0
          ? (best.goodMoves.length / best.totalMoves) * 100
          : 0
      return accuracy > bestAccuracy ? drill : best
    }, completedDrills[0])

    const worstPerformance = completedDrills.reduce((worst, drill) => {
      const accuracy =
        drill.totalMoves > 0
          ? (drill.goodMoves.length / drill.totalMoves) * 100
          : 0
      const worstAccuracy =
        worst && worst.totalMoves > 0
          ? (worst.goodMoves.length / worst.totalMoves) * 100
          : 100
      return accuracy < worstAccuracy ? drill : worst
    }, completedDrills[0])

    return {
      totalDrills: configuration.drillCount,
      completedDrills,
      overallAccuracy,
      totalBlunders,
      totalGoodMoves,
      bestPerformance,
      worstPerformance,
      averageEvaluation,
    }
  }, [completedDrills, configuration.drillCount])

  // Helper function to update a completed drill with new moves
  const updateCompletedDrill = useCallback(
    (updatedGame: OpeningDrillGame) => {
      // Check if this is a loaded completed drill (ID ends with '-replay')
      if (updatedGame.id.endsWith('-replay')) {
        const originalId = updatedGame.id.replace('-replay', '')

        setCompletedDrills((prev) =>
          prev.map((completedDrill) => {
            if (completedDrill.selection.id === originalId) {
              // Update the completed drill with new moves and final position
              const finalNode = controller.currentNode
              return {
                ...completedDrill,
                allMoves: updatedGame.moves,
                playerMoves: updatedGame.moves.filter((_, index) => {
                  // Only count player moves (assuming alternating turns)
                  const isPlayerMove =
                    completedDrill.selection.playerColor === 'white'
                      ? index % 2 === 0
                      : index % 2 === 1
                  return isPlayerMove
                }),
                totalMoves: updatedGame.playerMoveCount,
                finalNode: finalNode || completedDrill.finalNode,
              }
            }
            return completedDrill
          }),
        )
      }
    },
    [controller],
  )

  // Make a move for the player - enhanced to support variations and completion checking
  const makePlayerMove = useCallback(
    async (moveUci: string, fromNode?: GameNode) => {
      if (!currentDrillGame || !controller.currentNode || !isPlayerTurn) return

      try {
        const nodeToMoveFrom = fromNode || controller.currentNode

        // Validate the move first
        const chess = new Chess(nodeToMoveFrom.fen)
        const moveObj = chess.move(moveUci, { sloppy: true })

        if (!moveObj) {
          console.log('Invalid move:', moveUci)
          return
        }

        let newNode: GameNode | null = null

        // Check if this move already exists as a child
        const existingChild = nodeToMoveFrom.children.find(
          (child: GameNode) => child.move === moveUci,
        )

        if (existingChild) {
          // Move already exists, just navigate to it
          newNode = existingChild
        } else {
          // If we're making a move from an earlier position, clear the main line from this point forward
          // This allows overwriting the previous line when making different moves
          if (nodeToMoveFrom.mainChild) {
            // Remove all children to clear the main line from this point
            nodeToMoveFrom.removeAllChildren()
          }

          // Add the new move as the main line continuation
          newNode = controller.gameTree.addMainMove(
            nodeToMoveFrom,
            chess.fen(),
            moveUci,
            moveObj.san,
          )
        }

        if (newNode) {
          // Check if this was a capture move for sound effect
          const isCapture = !!chess.get(moveUci.slice(2, 4))

          // Play sound effect
          playSound(isCapture)

          // Update the controller to the new node
          controller.setCurrentNode(newNode)

          // Update drill game state
          // Recalculate from the main line after opening
          const mainLine = controller.gameTree.getMainLine()
          const openingLength = currentDrillGame.openingEndNode
            ? currentDrillGame.openingEndNode.getPath().length
            : 1
          const movesAfterOpening = mainLine.slice(openingLength)

          // Simple player move count - count moves where it's the player's turn
          let playerMoveCount = 0
          if (currentDrillGame.openingEndNode) {
            const openingChess = new Chess(currentDrillGame.openingEndNode.fen)
            let isPlayerTurn =
              (openingChess.turn() === 'w') ===
              (currentDrill?.playerColor === 'white')

            for (const moveNode of movesAfterOpening) {
              if (isPlayerTurn) {
                playerMoveCount++
              }
              isPlayerTurn = !isPlayerTurn
            }
          }

          const updatedGame = {
            ...currentDrillGame,
            moves: movesAfterOpening
              .map((node) => node.move)
              .filter(Boolean) as string[],
            currentFen: newNode.fen,
            playerMoveCount,
          }

          setCurrentDrillGame(updatedGame)

          // Update completed drill if this is a loaded completed drill
          updateCompletedDrill(updatedGame)

          // Set flag to indicate we're waiting for Maia's response (after player move, it becomes Maia's turn)
          setWaitingForMaiaResponse(true)

          // Check if drill is complete after this move (only if not in continue analyzing mode)
          if (
            updatedGame.playerMoveCount >= currentDrill!.targetMoveNumber &&
            !continueAnalyzingMode
          ) {
            // Delay completion to allow for Maia's response if it's Maia's turn
            setTimeout(() => {
              completeDrill(updatedGame)
            }, 1500)
          }
        }
      } catch (error) {
        console.error('Error making player move:', error)
      }
    },
    [
      currentDrillGame,
      controller,
      isPlayerTurn,
      playSound,
      currentDrill,
      completeDrill,
      continueAnalyzingMode,
      updateCompletedDrill,
    ],
  )

  // Make Maia move
  const makeMaiaMove = useCallback(
    async (fromNode: GameNode | null) => {
      if (!currentDrillGame || !currentDrill || !fromNode) return

      try {
        const response = await getGameMove(
          [],
          currentDrill.maiaVersion,
          fromNode.fen,
          null,
          0,
          0,
        )
        const maiaMove = response.top_move

        if (maiaMove && maiaMove.length >= 4) {
          let newNode: GameNode | null = null

          // Check if this move already exists as a child
          const existingChild = fromNode.children.find(
            (child: GameNode) => child.move === maiaMove,
          )

          if (existingChild) {
            newNode = existingChild
          } else {
            // For opening drills, always continue the main line to ensure proper navigation
            const chess = new Chess(fromNode.fen)
            const moveObj = chess.move(maiaMove, { sloppy: true })

            if (moveObj) {
              newNode = controller.gameTree.addMainMove(
                fromNode,
                chess.fen(),
                maiaMove,
                moveObj.san,
              )
            }
          }

          if (newNode) {
            // Check if this was a capture move for sound effect
            const chess = new Chess(fromNode.fen)
            const pieceAtDestination = chess.get(maiaMove.slice(2, 4))
            const isCapture = !!pieceAtDestination

            // Play sound effect for Maia's move
            playSound(isCapture)

            // Update the controller to the new node immediately
            controller.setCurrentNode(newNode)

            // Update the drill game state
            // Recalculate from the main line after opening
            const mainLine = controller.gameTree.getMainLine()
            const openingLength = currentDrillGame.openingEndNode
              ? currentDrillGame.openingEndNode.getPath().length
              : 1
            const movesAfterOpening = mainLine.slice(openingLength)

            // Simple player move count - count moves where it's the player's turn
            let playerMoveCount = 0
            if (currentDrillGame.openingEndNode) {
              const openingChess = new Chess(
                currentDrillGame.openingEndNode.fen,
              )
              let isPlayerTurn =
                (openingChess.turn() === 'w') ===
                (currentDrill?.playerColor === 'white')

              for (const moveNode of movesAfterOpening) {
                if (isPlayerTurn) {
                  playerMoveCount++
                }
                isPlayerTurn = !isPlayerTurn
              }
            }

            const updatedGame = {
              ...currentDrillGame,
              moves: movesAfterOpening
                .map((node) => node.move)
                .filter(Boolean) as string[],
              currentFen: newNode.fen,
              playerMoveCount,
            }

            setCurrentDrillGame(updatedGame)

            // Update completed drill if this is a loaded completed drill
            updateCompletedDrill(updatedGame)

            // Clear the waiting flag since Maia has responded
            setWaitingForMaiaResponse(false)
          }
        }
      } catch (error) {
        console.error('Error making Maia move:', error)
      }
    },
    [
      currentDrillGame,
      controller,
      currentDrill,
      playSound,
      updateCompletedDrill,
    ],
  )

  // Store makeMaiaMove in a ref to avoid circular dependencies
  const makeMaiaMoveRef = useRef(makeMaiaMove)
  makeMaiaMoveRef.current = makeMaiaMove

  // Handle initial Maia move if needed
  useEffect(() => {
    if (
      currentDrillGame &&
      controller.currentNode &&
      !isPlayerTurn &&
      currentDrillGame.moves.length === 0 && // Only for fresh drills, not loaded ones
      currentDrillGame.openingEndNode &&
      controller.currentNode === currentDrillGame.openingEndNode &&
      !isDrillComplete &&
      !continueAnalyzingMode // Don't trigger when in analysis mode (like when loading completed drills)
    ) {
      // It's Maia's turn to move first from the opening position
      setWaitingForMaiaResponse(true)
      setTimeout(() => {
        makeMaiaMoveRef.current(controller.currentNode)
      }, 1000)
    }
  }, [
    currentDrillGame,
    controller.currentNode,
    isPlayerTurn,
    isDrillComplete,
    continueAnalyzingMode,
  ])

  // Handle Maia's response after player moves - only when we're actually waiting for a response
  useEffect(() => {
    if (
      currentDrillGame &&
      controller.currentNode &&
      !isPlayerTurn &&
      waitingForMaiaResponse &&
      currentDrillGame.moves.length > 0 && // Only respond if moves have been made (not initial setup)
      !isDrillComplete
    ) {
      // It's Maia's turn to respond to the player's move
      const timeoutId = setTimeout(() => {
        makeMaiaMoveRef.current(controller.currentNode)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [
    currentDrillGame,
    controller.currentNode,
    isPlayerTurn,
    waitingForMaiaResponse,
    isDrillComplete,
  ])

  // Reset current drill to starting position
  const resetCurrentDrill = useCallback(() => {
    if (!currentDrill) return

    const startingFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const gameTree = new GameTree(startingFen)

    const pgn = currentDrill.variation
      ? currentDrill.variation.pgn
      : currentDrill.opening.pgn
    const endNode = parsePgnToTree(pgn, gameTree)

    const resetGame: OpeningDrillGame = {
      id: currentDrill.id,
      selection: currentDrill,
      moves: [],
      tree: gameTree,
      currentFen: endNode?.fen || startingFen,
      toPlay: endNode
        ? new Chess(endNode.fen).turn() === 'w'
          ? 'white'
          : 'black'
        : 'white',
      openingEndNode: endNode,
      playerMoveCount: 0,
    }

    setCurrentDrillGame(resetGame)
    setWaitingForMaiaResponse(false)
    setContinueAnalyzingMode(false) // Reset continue analyzing mode when resetting drill
  }, [currentDrill])

  return {
    // Drill state
    currentDrill,
    remainingDrills,
    completedDrills,
    currentDrillGame,
    currentDrillIndex,
    totalDrills: configuration.drillCount,
    isPlayerTurn,
    isDrillComplete,
    isAtOpeningEnd,

    // Tree controller
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

    // Available moves
    moves,

    // Actions
    makePlayerMove,
    resetCurrentDrill,
    completeDrill,
    moveToNextDrill,
    continueAnalyzing,
    continueAnalyzingFromFinal,

    // Analysis
    analysisEnabled,
    setAnalysisEnabled,

    // Modal states
    showPerformanceModal,
    showFinalModal,
    currentPerformanceData,
    overallPerformanceData,
    setShowFinalModal,
    isAnalyzingDrill,

    // Reset drill session
    resetDrillSession,

    // Check if all drills are completed
    areAllDrillsCompleted,

    // Load a specific completed drill for analysis
    loadCompletedDrill,

    // Show final summary modal
    showSummary,
  }
}
