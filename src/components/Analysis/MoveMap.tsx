import {
  Cell,
  Label,
  XAxis,
  YAxis,
  Scatter,
  ScatterChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { useContext, useState } from 'react'
import { ColorSanMapping } from 'src/types'
import type { Key } from 'chessground/types'
import type { DrawShape } from 'chessground/draw'
import { WindowSizeContext } from 'src/contexts'
import { MoveTooltip } from './MoveTooltip'

interface MoveMapEntry {
  move: string
  x: number
  y: number
  opacity?: number
  importance?: number
  size?: number
  rawCp?: number
  winrate?: number
  rawMaiaProb?: number
  relativeCp?: number
}

interface Props {
  moveMap?: MoveMapEntry[]
  colorSanMapping: ColorSanMapping
  setHoverArrow: React.Dispatch<React.SetStateAction<DrawShape | null>>
}

// Helper function to convert hex color to rgba with alpha
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const MoveMap: React.FC<Props> = ({
  moveMap,
  colorSanMapping,
  setHoverArrow,
}: Props) => {
  const { isMobile } = useContext(WindowSizeContext)
  const [hoveredMove, setHoveredMove] = useState<string | null>(null)
  const [hoveredMoveData, setHoveredMoveData] = useState<MoveMapEntry | null>(
    null,
  )
  const [mousePosition, setMousePosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const onMouseEnter = (
    move: string,
    moveData: MoveMapEntry,
    event?: React.MouseEvent,
  ) => {
    setHoverArrow({
      orig: move.slice(0, 2) as Key,
      dest: move.slice(2, 4) as Key,
      brush: 'green',
      modifiers: {
        lineWidth: 10,
      },
    })
    setHoveredMove(move)
    setHoveredMoveData(moveData)

    // Capture mouse position for tooltip positioning
    if (event) {
      // Get position relative to the viewport for better positioning
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      })
    }
  }

  const onMouseLeave = () => {
    setHoverArrow(null)
    setHoveredMove(null)
    setHoveredMoveData(null)
    setMousePosition(null)
  }

  // Handle mouse leaving the entire component
  const onContainerMouseLeave = () => {
    onMouseLeave()
  }

  const renderTooltip = () => {
    if (!hoveredMove || !hoveredMoveData || !mousePosition) return null

    return (
      <MoveTooltip
        move={hoveredMove}
        colorSanMapping={colorSanMapping}
        maiaProb={hoveredMoveData.rawMaiaProb}
        stockfishCp={hoveredMoveData.rawCp}
        stockfishWinrate={hoveredMoveData.winrate}
        stockfishLoss={hoveredMoveData.relativeCp}
        position={mousePosition}
      />
    )
  }

  return (
    <div
      className="flex h-64 max-h-full flex-col overflow-hidden bg-background-1/60 md:h-full md:rounded"
      onMouseLeave={onContainerMouseLeave}
    >
      <p className="p-3 text-primary md:text-lg">Move Map</p>
      <div className="relative flex h-full w-full flex-col">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 0, top: 5, right: 30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3C3C3C" />
            <XAxis
              dataKey="x"
              type="number"
              axisLine={false}
              label={{
                value: 'SF Loss',
                fill: '#76ADDD',
                position: 'insideBottom',
                fontSize: isMobile ? 14 : 18,
                fontWeight: 600,
                offset: -8,
                dx: isMobile ? -6 : -12,
              }}
              tickCount={5}
              tickLine={false}
              tickMargin={0}
              tick={{ fill: 'white', fontSize: 11 }}
              domain={[-4, 0]}
              ticks={[-4, -3, -2, -1, 0]}
            >
              <Label
                value="← Blunders"
                position="insideBottomLeft"
                fill="#5A9DD7"
                fontSize={12}
                fontWeight={500}
                dy={10}
                dx={isMobile ? -40 : -18}
              />
              <Label
                value="Best Moves →"
                position="insideBottomRight"
                fontSize={12}
                fill="#5A9DD7"
                fontWeight={500}
                dy={10}
                dx={18}
              />
            </XAxis>
            <YAxis
              dataKey="y"
              type="number"
              axisLine={false}
              label={{
                value: 'Maia',
                fill: '#FE7F6D',
                position: 'insideLeft',
                angle: -90,
                fontSize: isMobile ? 14 : 16,
                fontWeight: 600,
                dx: isMobile ? 5 : 10,
                dy: isMobile ? 20 : 32,
              }}
              tickCount={4}
              tick={{
                fill: 'white',
                fontSize: 11,
              }}
              tickMargin={0}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={([dataMin, dataMax]) => [0, dataMax > 60 ? 100 : 60]}
            >
              <Label
                value="← Unlikely"
                dx={10}
                angle={-90}
                fontSize={12}
                fontWeight={500}
                dy={isMobile ? 100 : 140}
                position="insideLeft"
                fill="#BF5F52"
              />
              <Label
                value="Likely →"
                fill="#BF5F52"
                position="insideLeft"
                fontSize={12}
                dx={10}
                angle={-90}
                fontWeight={500}
                dy={isMobile ? -30 : -56}
              />
            </YAxis>
            {moveMap?.map((entry, index) => {
              const opacity = entry.opacity ?? 1
              const size = entry.size ?? (isMobile ? 8 : 10)
              const baseColor = colorSanMapping[entry.move]?.color ?? '#fff'
              const fillColor = baseColor.startsWith('#')
                ? hexToRgba(baseColor, opacity)
                : baseColor

              return (
                <Scatter
                  key={`scatter-${entry.move}${index}`}
                  name={`Move-${entry.move}`}
                  data={[entry]}
                  fill={fillColor}
                  r={size}
                >
                  <Cell
                    fill={fillColor}
                    onMouseEnter={(event) =>
                      onMouseEnter(entry.move, entry, event)
                    }
                    onMouseLeave={onMouseLeave}
                    style={{ cursor: 'pointer' }}
                  />
                </Scatter>
              )
            })}
          </ScatterChart>
        </ResponsiveContainer>

        {/* Comprehensive tooltip */}
        {renderTooltip()}
      </div>
    </div>
  )
}
