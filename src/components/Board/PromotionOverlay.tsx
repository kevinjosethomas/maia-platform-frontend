/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from 'react'

import { Color } from 'src/types'
import { TreeControllerContext } from 'src/contexts'

interface Props {
  player: Color
  file: string
  onPlayerSelectPromotion: (piece: string) => void
}

export const PromotionOverlay: React.FC<Props> = ({
  file,
  onPlayerSelectPromotion,
}: Props) => {
  const { orientation } = useContext(TreeControllerContext)

  const pieces = ['q', 'n', 'r', 'b']
  const flipped = orientation == 'black'

  if (flipped) {
    pieces.reverse()
  }

  return (
    <>
      <div className="absolute left-0 top-0 z-10 flex h-full w-full flex-col items-center justify-center bg-backdrop/80">
        <div className="flex h-1/2 w-1/2 flex-row items-center justify-center">
          {pieces.map((piece) => {
            let asset
            asset = flipped ? `black ` : `white `
            if (piece === 'q') {
              asset += 'queen'
            } else if (piece === 'n') {
              asset += 'knight'
            } else if (piece === 'r') {
              asset += 'rook'
            } else if (piece === 'b') {
              asset += 'bishop'
            }

            return (
              <button
                key={piece}
                onClick={() => onPlayerSelectPromotion(piece)}
                className="flex h-1/4 w-full items-center justify-center bg-engine-3 hover:bg-engine-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="h-20 w-20"
                  src={`/assets/pieces/${asset}.svg`}
                  alt={piece}
                />
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
