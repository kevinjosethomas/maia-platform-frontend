import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { Highlight, MoveMap, BlunderMeter } from '../Analysis'
import { GameNode } from 'src/types'
import { GameTree } from 'src/types/base/tree'
import { Chess, PieceSymbol } from 'chess.ts'
import type { Key } from 'chessground/types'
import type { DrawShape } from 'chessground/draw'
import toast from 'react-hot-toast'

interface Props {
  currentNode: GameNode | null
  gameTree: GameTree | null
  analysisEnabled: boolean
  onToggleAnalysis: () => void
  playerColor: 'white' | 'black'
  maiaVersion: string
  analysisController: any // Analysis controller passed from parent
  hover: (move?: string) => void
  setHoverArrow: React.Dispatch<React.SetStateAction<DrawShape | null>>
}

export const OpeningDrillAnalysis: React.FC<Props> = ({
  currentNode,
  gameTree,
  analysisEnabled,
  onToggleAnalysis,
  playerColor,
  maiaVersion,
  analysisController,
  hover: parentHover,
  setHoverArrow: parentSetHoverArrow,
}) => {
  const toastId = useRef<string | null>(null)

  // Toast notifications for Maia model status
  useEffect(() => {
    return () => {
      toast.dismiss()
    }
  }, [])

  useEffect(() => {
    if (analysisController.maiaStatus === 'loading' && !toastId.current) {
      toastId.current = toast.loading('Loading Maia Model...')
    } else if (analysisController.maiaStatus === 'ready') {
      if (toastId.current) {
        toast.success('Loaded Maia! Analysis is ready', {
          id: toastId.current,
        })
        toastId.current = null
      } else {
        toast.success('Loaded Maia! Analysis is ready')
      }
    }
  }, [analysisController.maiaStatus])

  const hover = useCallback(
    (move?: string) => {
      if (move && analysisEnabled) {
        parentHover(move)
      } else {
        parentHover()
      }
    },
    [analysisEnabled, parentHover],
  )

  const makeMove = useCallback(
    (move: string) => {
      if (!analysisEnabled || !currentNode || !gameTree) return

      const chess = new Chess(currentNode.fen)
      const moveAttempt = chess.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: move[4] ? (move[4] as PieceSymbol) : undefined,
      })

      if (moveAttempt) {
        const newFen = chess.fen()
        const moveString =
          moveAttempt.from +
          moveAttempt.to +
          (moveAttempt.promotion ? moveAttempt.promotion : '')
        const san = moveAttempt.san

        // For opening drills, always update the main line instead of creating variations
        // If the move already exists as the main child, just navigate to it
        if (currentNode.mainChild?.move === moveString) {
          analysisController.goToNode(currentNode.mainChild)
        } else {
          // Remove any existing children first to replace the main line from this point forward
          currentNode.removeAllChildren()

          // Create new main line continuation
          const newNode = gameTree.addMainMove(
            currentNode,
            newFen,
            moveString,
            san,
            analysisController.currentMaiaModel,
          )
          analysisController.goToNode(newNode)
        }
      }
    },
    [analysisEnabled, currentNode, gameTree, analysisController],
  )

  // No-op handlers for blurred analysis components when disabled
  const mockHover = useCallback(() => {
    // Intentionally empty - no interaction allowed when analysis disabled
  }, [])

  const mockMakeMove = useCallback(() => {
    // Intentionally empty - no moves allowed when analysis disabled
  }, [])

  const mockSetHoverArrow = useCallback(() => {
    // Intentionally empty - no hover arrows when analysis disabled
  }, [])

  // Create empty data structures that match expected types
  const emptyBlunderMeterData = useMemo(
    () => ({
      goodMoves: { moves: [], probability: 0 },
      okMoves: { moves: [], probability: 0 },
      blunderMoves: { moves: [], probability: 0 },
    }),
    [],
  )

  const emptyRecommendations = useMemo(
    () => ({
      maia: undefined,
      stockfish: undefined,
    }),
    [],
  )

  return (
    <div className="flex h-[calc(55vh+4.5rem)] w-full flex-col gap-2">
      {/* Analysis Toggle */}
      <div className="flex items-center justify-between rounded bg-background-1 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">analytics</span>
          <h3 className="font-semibold">Analysis</h3>
        </div>
        <button
          onClick={onToggleAnalysis}
          className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${
            analysisEnabled
              ? 'bg-human-4 text-white hover:bg-human-4/80'
              : 'bg-background-2 text-secondary hover:bg-background-3'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {analysisEnabled ? 'visibility' : 'visibility_off'}
          </span>
          {analysisEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Top Row - Highlight Component */}
      <div className="relative">
        <div className="flex h-[calc((55vh+4.5rem)/2)]">
          <Highlight
            hover={analysisEnabled ? hover : mockHover}
            makeMove={analysisEnabled ? makeMove : mockMakeMove}
            currentMaiaModel={analysisController.currentMaiaModel}
            recommendations={
              analysisEnabled
                ? analysisController.moveRecommendations
                : emptyRecommendations
            }
            moveEvaluation={
              analysisEnabled && analysisController.moveEvaluation
                ? analysisController.moveEvaluation
                : {
                    maia: undefined,
                    stockfish: undefined,
                  }
            }
            movesByRating={
              analysisEnabled ? analysisController.movesByRating : undefined
            }
            colorSanMapping={
              analysisEnabled ? analysisController.colorSanMapping : {}
            }
            boardDescription={
              analysisEnabled
                ? analysisController.boardDescription || 'Analyzing position...'
                : 'Analysis is disabled. Enable analysis to see detailed move evaluations and recommendations.'
            }
          />
        </div>
        {!analysisEnabled && (
          <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded bg-background-1/80 backdrop-blur-sm">
            <div className="rounded bg-background-2/90 p-4 text-center shadow-lg">
              <span className="material-symbols-outlined mb-2 text-3xl text-human-3">
                lock
              </span>
              <p className="font-medium text-primary">Analysis Disabled</p>
              <p className="text-sm text-secondary">
                Enable analysis to see move evaluations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row - Move Map and Blunder Meter */}
      <div className="relative">
        <div className="flex h-[calc((55vh+4.5rem)/2)] flex-row gap-2">
          <div className="flex h-full w-full flex-col">
            <MoveMap
              moveMap={analysisEnabled ? analysisController.moveMap : undefined}
              colorSanMapping={
                analysisEnabled ? analysisController.colorSanMapping : {}
              }
              setHoverArrow={
                analysisEnabled ? parentSetHoverArrow : mockSetHoverArrow
              }
            />
          </div>
          <BlunderMeter
            hover={analysisEnabled ? hover : mockHover}
            makeMove={analysisEnabled ? makeMove : mockMakeMove}
            data={
              analysisEnabled
                ? analysisController.blunderMeter
                : emptyBlunderMeterData
            }
            colorSanMapping={
              analysisEnabled ? analysisController.colorSanMapping : {}
            }
          />
        </div>
        {!analysisEnabled && (
          <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded bg-background-1/80 backdrop-blur-sm">
            <div className="rounded bg-background-2/90 p-4 text-center shadow-lg">
              <span className="material-symbols-outlined mb-2 text-3xl text-human-3">
                lock
              </span>
              <p className="font-medium text-primary">Analysis Disabled</p>
              <p className="text-sm text-secondary">
                Enable analysis to see position evaluation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
