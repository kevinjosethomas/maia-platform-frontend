/* eslint-disable jsx-a11y/click-events-have-key-events */
import Chessground from '@react-chess/chessground'

import { Opening, OpeningVariation } from 'src/types'

interface Props {
  openings: Opening[]
  selectedOpening: Opening
  selectedVariation: OpeningVariation | null
  setSelectedOpening: (opening: Opening) => void
  setSelectedVariation: (variation: OpeningVariation | null) => void
}

export const OpeningBook: React.FC<Props> = ({
  openings,
  selectedOpening,
  selectedVariation,
  setSelectedOpening,
  setSelectedVariation,
}: Props) => {
  return (
    <div className="flex max-h-[40vh] flex-1 flex-col gap-2 border border-white border-opacity-5 bg-background-1 py-2 md:h-[75vh] md:max-h-max md:min-w-[40vh] md:max-w-[30%] md:rounded md:py-3">
      <div className="flex items-center gap-2 px-4 2xl:px-6">
        <i className="material-symbols-outlined text-xl md:text-3xl">
          menu_book
        </i>
        <h2 className="text-lg font-bold md:text-2xl">Opening Book</h2>
      </div>
      <div className="red-scrollbar flex flex-col overflow-y-scroll">
        {openings.map((opening, index) => (
          <div key={index} className="flex flex-col">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedOpening(opening)
                setSelectedVariation(null)
              }}
              className={`flex cursor-pointer flex-row items-center gap-3 px-4 py-2 md:py-4 2xl:flex-row 2xl:px-6 ${selectedOpening.id === opening.id ? 'bg-human-2/10' : 'hover:bg-human-2/5'}`}
            >
              <div className="aspect-square min-h-20 min-w-20 md:min-h-16 md:min-w-16 2xl:min-h-24 2xl:min-w-24">
                <Chessground
                  contained
                  config={{
                    viewOnly: true,
                    fen: opening.fen,
                    coordinates: false,
                    animation: { enabled: false },
                  }}
                />
              </div>
              <div className="flex max-h-20 flex-col gap-0.5 overflow-hidden 2xl:max-h-24">
                <h4 className="text-xs font-medium xl:text-sm 2xl:text-lg">
                  {opening.name}
                </h4>
                <p className="text-ellipsis text-xs text-primary/60">
                  {opening.description}
                </p>
              </div>
            </div>
            {selectedOpening.id === opening.id && opening.variations.length ? (
              <div className="flex flex-col bg-backdrop/50 py-1">
                {opening.variations.map((variation, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedVariation(variation)}
                    className={`cursor-pointer px-4 py-1 2xl:px-6 ${selectedVariation?.id === variation.id ? 'bg-human-2/10' : 'hover:bg-human-2/5'}`}
                  >
                    <p className="text-xs text-secondary xl:text-sm">
                      {variation.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <></>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
