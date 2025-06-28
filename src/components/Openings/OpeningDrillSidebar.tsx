import React from 'react'
import Image from 'next/image'
import { CompletedDrill, OpeningSelection } from 'src/types/openings'

interface Props {
  currentDrill: OpeningSelection | null
  completedDrills: CompletedDrill[]
  remainingDrills: OpeningSelection[]
  currentDrillIndex: number
  totalDrills: number
  onResetCurrentDrill: () => void
  onChangeSelections?: () => void
  onLoadCompletedDrill?: (drill: CompletedDrill) => void
}

export const OpeningDrillSidebar: React.FC<Props> = ({
  currentDrill,
  completedDrills,
  remainingDrills,
  currentDrillIndex,
  totalDrills,
  onResetCurrentDrill,
  onChangeSelections,
  onLoadCompletedDrill,
}) => {
  return (
    <div className="flex h-full w-full flex-col border-r border-white/10 bg-background-1 2xl:min-w-72">
      {/* Current Drill Info */}
      <div className="border-b border-white/10 p-4">
        <h2 className="mb-2 text-lg font-bold text-primary">Current Drill</h2>
        {currentDrill ? (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-primary">
                {currentDrill.opening.name}
              </p>
              {currentDrill.variation && (
                <p className="text-xs text-secondary">
                  {currentDrill.variation.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <div className="relative h-4 w-4">
                <Image
                  src={
                    currentDrill.playerColor === 'white'
                      ? '/assets/pieces/white king.svg'
                      : '/assets/pieces/black king.svg'
                  }
                  fill={true}
                  alt={`${currentDrill.playerColor} king`}
                />
              </div>
              <span>
                vs Maia {currentDrill.maiaVersion.replace('maia_kdd_', '')}
              </span>
              <span>•</span>
              <span>{currentDrill.targetMoveNumber} moves</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={onResetCurrentDrill}
                className="w-full rounded bg-background-2 py-1 text-xs transition-colors hover:bg-background-3"
              >
                Reset Drill
              </button>
              {onChangeSelections && (
                <button
                  onClick={onChangeSelections}
                  className="w-full rounded bg-background-2 py-1 text-xs transition-colors hover:bg-background-3"
                >
                  Change
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-secondary">No drill selected</p>
        )}
      </div>

      {/* Drill Progress */}
      <div className="border-b border-white/10 p-4">
        <h3 className="mb-2 text-sm font-medium text-primary">
          Completed Drills ({completedDrills.length})
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-secondary">Drill Progress</span>
            <span className="font-medium text-human-4">
              {Math.min(completedDrills.length + 1, totalDrills)} of{' '}
              {totalDrills}
            </span>
          </div>
          <div className="h-2 w-full rounded bg-background-2">
            <div
              className="h-full rounded bg-human-4 transition-all duration-300"
              style={{
                width: `${
                  totalDrills > 0
                    ? Math.min(
                        (completedDrills.length / totalDrills) * 100,
                        100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Completed Drills List */}
      <div className="flex h-64 flex-col overflow-hidden">
        <div className="red-scrollbar flex h-full flex-col overflow-y-auto">
          {completedDrills.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="max-w-[12rem] text-center text-xs text-secondary">
                Complete your first opening drill to see your progress here
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {completedDrills.map((completedDrill, index) => {
                const accuracy =
                  completedDrill.totalMoves > 0
                    ? Math.round(
                        (completedDrill.goodMoves.length /
                          completedDrill.totalMoves) *
                          100,
                      )
                    : 0

                // Check if this drill is currently loaded
                const isCurrentlyLoaded =
                  currentDrill &&
                  currentDrill.opening.id ===
                    completedDrill.selection.opening.id &&
                  currentDrill.variation?.id ===
                    completedDrill.selection.variation?.id &&
                  currentDrill.playerColor ===
                    completedDrill.selection.playerColor &&
                  currentDrill.maiaVersion ===
                    completedDrill.selection.maiaVersion

                return (
                  <button
                    key={completedDrill.selection.id}
                    className={`w-full border-b border-white/5 px-3 py-2 text-left transition-colors ${
                      isCurrentlyLoaded
                        ? 'border-human-4/30 bg-human-4/20'
                        : 'bg-background-1'
                    } ${
                      onLoadCompletedDrill
                        ? 'cursor-pointer hover:bg-background-2'
                        : ''
                    }`}
                    onClick={() => onLoadCompletedDrill?.(completedDrill)}
                    disabled={!onLoadCompletedDrill}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-primary">
                          {completedDrill.selection.opening.name}
                        </p>
                        {completedDrill.selection.variation && (
                          <p className="text-xs text-secondary">
                            {completedDrill.selection.variation.name}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <div className="relative h-3 w-3">
                            <Image
                              src={
                                completedDrill.selection.playerColor === 'white'
                                  ? '/assets/pieces/white king.svg'
                                  : '/assets/pieces/black king.svg'
                              }
                              fill={true}
                              alt={`${completedDrill.selection.playerColor} king`}
                            />
                          </div>
                          <span className="text-secondary">
                            vs Maia{' '}
                            {completedDrill.selection.maiaVersion.replace(
                              'maia_kdd_',
                              '',
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xs font-bold ${
                            accuracy >= 80
                              ? 'text-green-400'
                              : accuracy >= 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {accuracy}%
                        </div>
                        <div className="text-xs text-secondary">
                          {completedDrill.totalMoves} moves
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 flex gap-4 text-xs">
                      <span className="text-green-400">
                        ✓ {completedDrill.goodMoves.length}
                      </span>
                      <span className="text-red-400">
                        ✗ {completedDrill.blunders.length}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
