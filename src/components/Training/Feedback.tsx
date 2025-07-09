import { Chess } from 'chess.ts'
import { useMemo, Dispatch, SetStateAction } from 'react'

import { Markdown } from 'src/components'
import { useTrainingController } from 'src/hooks'
import { TrainingGame, Status } from 'src/types/training'

interface Props {
  status: string
  game: TrainingGame
  setAndGiveUp: () => void
  getNewGame: () => Promise<void>
  setStatus: Dispatch<SetStateAction<Status>>
  controller: ReturnType<typeof useTrainingController>
}

export const Feedback: React.FC<Props> = ({
  game,
  status,
  setStatus,
  getNewGame,
  setAndGiveUp,
  controller: controller,
}: Props) => {
  const { targetIndex } = game

  const turn =
    new Chess(game.moves[targetIndex].board).turn() === 'w' ? 'white' : 'black'

  const archivedContent = `
  ##### PUZZLE COMPLETED
  You already solved this puzzle. Use the boxes on the left to navigate to another puzzle.
`

  const defaultContent = `
  ##### YOUR TURN
  Find the best move for **${turn}**!
  `
  const incorrectContent = `
  ##### ${controller.currentNode.san} is incorrect
  Try again or give up to analyze the board and see the best move.
  `

  const correctContent = `
  ##### Correct! ${controller.currentNode.san} is the best move.
  You can now explore and analyze the position by making moves, or train on another position.
  `

  const gaveUpContent = `
  ##### Explore the position
  Explore the current position by making moves or train on another position.`

  const content = useMemo(() => {
    if (status === 'archived') {
      return archivedContent
    } else if (status === 'forfeit') {
      return gaveUpContent
    } else if (status === 'correct') {
      return correctContent
    } else if (status === 'incorrect') {
      return incorrectContent
    } else {
      return defaultContent
    }
  }, [defaultContent, incorrectContent, correctContent, status, targetIndex])

  return (
    <div className="flex w-screen flex-1 flex-col rounded-sm bg-background-1 p-3 md:w-auto md:p-5 lg:justify-between">
      <div>
        <Markdown>{content.trim()}</Markdown>
        {(status === 'forfeit' || status === 'correct') && (
          <div className="mt-4 flex items-start gap-2">
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs text-human-3">
                arrow_outward
              </span>
              <span className="text-xs text-human-3">Most Human Move</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs text-engine-3">
                arrow_outward
              </span>
              <span className="text-xs text-engine-3">Best Engine Move</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex min-w-32 flex-row gap-1.5 lg:mt-0 lg:flex-col">
        {status !== 'archived' && (
          <>
            {status === 'incorrect' && (
              <button
                onClick={() => {
                  setStatus('default')
                  controller.reset()
                }}
                className="flex w-full justify-center rounded-sm bg-engine-3 py-1.5 text-sm font-medium text-primary transition duration-300 hover:bg-engine-4 disabled:bg-backdrop disabled:text-secondary"
              >
                Try Again
              </button>
            )}
            {status !== 'forfeit' && status !== 'correct' && (
              <button
                onClick={setAndGiveUp}
                className="flex w-full justify-center rounded-sm bg-human-3 py-1.5 text-sm font-medium text-primary transition duration-300 hover:bg-human-4 disabled:bg-backdrop disabled:text-secondary"
              >
                Give Up
              </button>
            )}
            {(status === 'forfeit' || status === 'correct') && (
              <button
                onClick={async () => {
                  await getNewGame()
                }}
                className="flex w-full justify-center rounded-sm bg-human-3 py-1.5 text-sm font-medium text-primary transition duration-300 hover:bg-human-4 disabled:bg-backdrop disabled:text-secondary"
              >
                Next Puzzle
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
