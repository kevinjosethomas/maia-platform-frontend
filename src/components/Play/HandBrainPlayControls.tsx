/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { PieceSymbol } from 'chess.ts'

import { Color } from 'src/types'

const pieceTypes: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p']

const pieceColorMap: { [key: string]: string } = {
  wp: 'white pawn',
  wk: 'white king',
  wq: 'white queen',
  wr: 'white rook',
  wb: 'white bishop',
  wn: 'white knight',
  bp: 'black pawn',
  bk: 'black king',
  bq: 'black queen',
  br: 'black rook',
  bb: 'black bishop',
  bn: 'black knight',
}

interface Props {
  isBrain: boolean
  color: Color
  movablePieceTypes: PieceSymbol[]
  selectedPiece?: PieceSymbol
  playerActive: boolean
  gameOver: boolean
  selectPiece: (selectedPiece: PieceSymbol) => void
  resign?: () => void
  offerDraw?: () => void
  playAgain?: () => void
}

export const HandBrainPlayControls: React.FC<Props> = ({
  playerActive,
  gameOver,
  isBrain,
  color,
  selectedPiece,
  movablePieceTypes,
  selectPiece,
  resign,
  offerDraw,
  playAgain,
}: Props) => {
  const status = playerActive
    ? isBrain
      ? selectedPiece
        ? 'Waiting for hand'
        : 'Select a piece'
      : selectedPiece
        ? 'Your turn'
        : 'Waiting for brain'
    : 'Waiting for opponent'

  return (
    <div>
      <div
        id="play-controls"
        className="flex flex-col items-center justify-center p-6"
      >
        {gameOver ? (
          <>
            {playAgain ? (
              <button
                onClick={playAgain}
                className="flex w-full justify-center rounded bg-human-3 py-2 text-primary transition duration-200 hover:bg-human-4"
              >
                Play again
              </button>
            ) : null}
          </>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center justify-center">
              <p className="font-bold">{status}</p>
              <h2 className="text-base">
                {isBrain ? 'You are the brain' : 'You are the hand'}
              </h2>
            </div>
            {isBrain ? (
              <div className="flex w-full flex-wrap items-start justify-center gap-2">
                {pieceTypes.map((p) => (
                  <button
                    key={p}
                    onClick={() => selectPiece(p)}
                    disabled={
                      movablePieceTypes.indexOf(p) == -1 ||
                      !playerActive ||
                      !!selectedPiece
                    }
                    className="flex h-16 w-16 items-center justify-center rounded border border-primary/10 bg-[#f0d9b5] disabled:bg-background-1"
                  >
                    <img
                      src={`/assets/pieces/${pieceColorMap[color[0] + p]}.svg`}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-30 w-30 flex items-center justify-center">
                {selectedPiece ? (
                  <img
                    src={`/assets/pieces/${pieceColorMap[color[0] + selectedPiece]}.svg`}
                    className="h-20 w-20 rounded bg-[#f0d9b5] bg-contain"
                  />
                ) : null}
              </div>
            )}
            {offerDraw ? (
              <button
                onClick={offerDraw}
                className="mt-4 flex w-full justify-center rounded bg-engine-3 py-2 text-primary transition duration-200 hover:bg-engine-4"
              >
                Offer draw
              </button>
            ) : null}
            {resign ? (
              <button
                onClick={resign}
                className="mt-4 flex w-full justify-center rounded bg-human-3 py-2 text-primary transition duration-200 hover:bg-human-4"
              >
                Resign
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
