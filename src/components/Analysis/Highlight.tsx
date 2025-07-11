import { MoveTooltip } from './MoveTooltip'
import { InteractiveDescription } from './InteractiveDescription'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MaiaEvaluation, StockfishEvaluation, ColorSanMapping } from 'src/types'

type DescriptionSegment =
  | { type: 'text'; content: string }
  | { type: 'move'; san: string; uci: string }

export const MAIA_MODELS = [
  'maia_kdd_1100',
  'maia_kdd_1200',
  'maia_kdd_1300',
  'maia_kdd_1400',
  'maia_kdd_1500',
  'maia_kdd_1600',
  'maia_kdd_1700',
  'maia_kdd_1800',
  'maia_kdd_1900',
]

interface Props {
  currentMaiaModel: string
  setCurrentMaiaModel: (model: string) => void
  moveEvaluation: {
    maia?: MaiaEvaluation
    stockfish?: StockfishEvaluation
  }
  colorSanMapping: ColorSanMapping
  recommendations: {
    maia?: { move: string; prob: number }[]
    stockfish?: {
      move: string
      cp: number
      winrate?: number
      winrate_loss?: number
    }[]
    isBlackTurn?: boolean
  }
  hover: (move?: string) => void
  makeMove: (move: string) => void
  boardDescription: { segments: DescriptionSegment[] }
}

export const Highlight: React.FC<Props> = ({
  hover,
  makeMove,
  moveEvaluation,
  colorSanMapping,
  recommendations,
  currentMaiaModel,
  setCurrentMaiaModel,
  boardDescription,
}: Props) => {
  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    move: string
    maiaProb?: number
    stockfishCp?: number
    stockfishWinrate?: number
    stockfishLoss?: number
    position: { x: number; y: number }
  } | null>(null)

  const findMatchingMove = (move: string, source: 'maia' | 'stockfish') => {
    if (source === 'maia') {
      return recommendations.stockfish?.find((rec) => rec.move === move)
    } else {
      return recommendations.maia?.find((rec) => rec.move === move)
    }
  }

  const handleMouseEnter = (
    move: string,
    source: 'maia' | 'stockfish',
    event: React.MouseEvent,
    prob?: number,
    cp?: number,
    winrate?: number,
    winrateLoss?: number,
  ) => {
    hover(move)

    const matchingMove = findMatchingMove(move, source)
    const maiaProb =
      source === 'maia' ? prob : (matchingMove as { prob: number })?.prob
    const stockfishCp =
      source === 'stockfish' ? cp : (matchingMove as { cp: number })?.cp
    const stockfishWinrate =
      source === 'stockfish'
        ? winrate
        : (matchingMove as { winrate?: number })?.winrate
    const stockfishLoss =
      source === 'stockfish'
        ? winrateLoss
        : (matchingMove as { winrate_loss?: number })?.winrate_loss

    // Get Stockfish loss from the move evaluation if not provided
    const actualStockfishLoss =
      stockfishLoss !== undefined
        ? stockfishLoss
        : moveEvaluation?.stockfish?.winrate_loss_vec?.[move]

    setTooltipData({
      move,
      maiaProb,
      stockfishCp,
      stockfishWinrate,
      stockfishLoss: actualStockfishLoss,
      position: { x: event.clientX, y: event.clientY },
    })
  }

  const handleMouseLeave = () => {
    hover()
    setTooltipData(null)
  }

  // Track whether description exists (not its content)
  const hasDescriptionRef = useRef(boardDescription?.segments?.length > 0)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const descriptionNowExists = boardDescription?.segments?.length > 0
    // Only trigger animation when presence changes (exists vs doesn't exist)
    if (hasDescriptionRef.current !== descriptionNowExists) {
      hasDescriptionRef.current = descriptionNowExists
      setAnimationKey((prev) => prev + 1)
    }
  }, [boardDescription?.segments?.length])

  return (
    <div
      id="analysis-highlight"
      className="flex h-full w-full flex-col border-white/40 bg-background-1"
    >
      <div className="grid grid-cols-2 border-b border-white/20">
        <div className="flex flex-col items-center justify-start gap-0.5 border-r border-white/20 bg-human-3/5 xl:gap-1">
          <div className="relative flex w-full flex-col border-b border-white/5">
            <select
              value={currentMaiaModel}
              onChange={(e) => setCurrentMaiaModel(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent py-2 text-center font-semibold text-human-1 outline-none transition-colors duration-200 hover:text-human-1/80 md:text-[10px] lg:text-xs"
            >
              {MAIA_MODELS.map((model) => (
                <option
                  value={model}
                  key={model}
                  className="bg-background-1 text-human-1"
                >
                  Maia {model.slice(-4)}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-sm text-human-1/60">
              keyboard_arrow_down
            </span>
          </div>
          <div className="flex w-full flex-col items-center justify-start border-b border-white/5 px-2 py-1 md:py-0.5 lg:py-1">
            <p className="whitespace-nowrap text-xs text-human-2 md:text-[10px] lg:text-xs">
              White Win %
            </p>
            <p className="text-lg font-bold text-human-1 md:text-sm lg:text-lg">
              {moveEvaluation?.maia
                ? `${Math.round(moveEvaluation.maia?.value * 1000) / 10}%`
                : '...'}
            </p>
          </div>
          <div className="flex w-full flex-col items-center justify-center px-3 py-1.5 xl:py-2">
            <p className="mb-1 whitespace-nowrap text-xs font-semibold text-human-2 md:text-[10px] lg:text-xs">
              Human Moves
            </p>
            <div className="flex w-full cursor-pointer items-center justify-between">
              <p className="text-left font-mono text-[10px] text-secondary/50">
                move
              </p>
              <p className="w-[32px] text-right font-mono text-[10px] text-secondary/50">
                prob
              </p>
            </div>
            {recommendations.maia?.slice(0, 4).map(({ move, prob }, index) => {
              return (
                <button
                  key={index}
                  className="flex w-full cursor-pointer items-center justify-between hover:underline"
                  style={{
                    color: colorSanMapping[move]?.color ?? '#fff',
                  }}
                  onMouseLeave={handleMouseLeave}
                  onMouseEnter={(e) => handleMouseEnter(move, 'maia', e, prob)}
                  onClick={() => makeMove(move)}
                >
                  <p className="text-left font-mono text-[10px] xl:text-xs">
                    {colorSanMapping[move]?.san ?? move}
                  </p>
                  <p className="text-right font-mono text-[10px] xl:text-xs">
                    {(Math.round(prob * 1000) / 10).toFixed(1)}%
                  </p>
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start gap-0.5 bg-engine-3/5 xl:gap-1">
          <div className="flex w-full flex-col border-b border-white/5 py-2">
            <p className="whitespace-nowrap text-center font-semibold text-engine-1 md:text-[10px] lg:text-xs">
              Stockfish 17{' '}
              {moveEvaluation?.stockfish?.depth
                ? ` (D${moveEvaluation.stockfish?.depth})`
                : ''}
            </p>
          </div>
          <div className="flex w-full flex-col items-center justify-start border-b border-white/5 px-2 py-1 md:py-0.5 lg:py-1">
            <p className="whitespace-nowrap text-xs text-engine-2 md:text-[10px] lg:text-xs">
              Eval
            </p>
            <p className="text-lg font-bold text-engine-1 md:text-sm lg:text-lg">
              {moveEvaluation?.stockfish
                ? `${moveEvaluation.stockfish.model_optimal_cp > 0 ? '+' : ''}${moveEvaluation.stockfish.model_optimal_cp / 100}`
                : '...'}
            </p>
          </div>
          <div className="flex w-full flex-col items-center justify-center px-3 py-1.5 xl:py-2">
            <p className="mb-1 whitespace-nowrap text-xs font-semibold text-engine-2 md:text-[10px] lg:text-xs">
              Engine Moves
            </p>
            <div className="flex w-full cursor-pointer items-center justify-between">
              <p className="text-left font-mono text-[10px] text-secondary/50">
                move
              </p>
              <p className="w-[32px] text-right font-mono text-[10px] text-secondary/50">
                eval
              </p>
            </div>
            {recommendations.stockfish
              ?.slice(0, 4)
              .map(({ move, cp, winrate, winrate_loss }, index) => {
                return (
                  <button
                    key={index}
                    className="flex w-full cursor-pointer items-center justify-between hover:underline"
                    style={{
                      color: colorSanMapping[move]?.color ?? '#fff',
                    }}
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        move,
                        'stockfish',
                        e,
                        undefined,
                        cp,
                        winrate,
                        winrate_loss,
                      )
                    }
                    onClick={() => makeMove(move)}
                  >
                    <p className="text-left font-mono text-[10px] xl:text-xs">
                      {colorSanMapping[move]?.san ?? move}
                    </p>
                    <p className="w-[32px] text-right font-mono text-[10px] xl:w-[36px] xl:text-xs 2xl:w-[42px]">
                      {cp > 0 ? '+' : null}
                      {`${(cp / 100).toFixed(2)}`}
                    </p>
                  </button>
                )
              })}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start justify-start bg-background-1/80 p-2 text-sm">
        <AnimatePresence mode="wait">
          {boardDescription?.segments?.length > 0 ? (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.075 }}
              className="w-full"
            >
              <InteractiveDescription
                description={boardDescription}
                colorSanMapping={colorSanMapping}
                moveEvaluation={moveEvaluation}
                hover={hover}
                makeMove={makeMove}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <MoveTooltip
          move={tooltipData.move}
          colorSanMapping={colorSanMapping}
          maiaProb={tooltipData.maiaProb}
          stockfishCp={tooltipData.stockfishCp}
          stockfishWinrate={tooltipData.stockfishWinrate}
          stockfishLoss={tooltipData.stockfishLoss}
          position={tooltipData.position}
        />
      )}
    </div>
  )
}
