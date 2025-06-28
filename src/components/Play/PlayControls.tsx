import { BaseGame } from 'src/types'

interface Props {
  game: BaseGame
  playerActive: boolean
  gameOver: boolean
  resign?: () => void
  offerDraw?: () => void
  playAgain?: () => void
}

export const PlayControls: React.FC<Props> = ({
  game,
  playerActive,
  gameOver,
  resign,
  offerDraw,
  playAgain,
}: Props) => {
  return (
    <div>
      {gameOver ? (
        <div className="flex flex-col gap-2 p-4 text-center">
          {game.id ? (
            <button
              onClick={() => {
                window.open(`/analysis/${game.id}/play`, '_blank')
              }}
              className="flex items-center justify-center rounded bg-engine-3 py-2 transition duration-200 hover:bg-engine-4"
            >
              <p className="font-medium uppercase tracking-wide">
                Analyze game
              </p>
            </button>
          ) : null}
          {playAgain ? (
            <button
              onClick={playAgain}
              className="flex items-center justify-center rounded bg-human-3 py-2 transition duration-200 hover:bg-human-4"
            >
              <p className="font-medium uppercase tracking-wide">Play again</p>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-4 text-center">
          {playerActive ? 'Your turn' : 'Waiting for opponent'}
          {offerDraw ? <button onClick={offerDraw}>Offer draw</button> : null}
          {resign ? (
            <button
              onClick={resign}
              className="flex items-center justify-center rounded bg-human-3 py-2 transition duration-200 hover:bg-human-4"
            >
              <p className="text-lg">Resign</p>
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
