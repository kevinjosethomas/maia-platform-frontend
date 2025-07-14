/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/named */
import {
  ScatterPlotRawSerie,
  ResponsiveScatterPlot,
  ScatterPlotTooltipProps,
} from '@nivo/scatterplot'
import { useCallback, useContext } from 'react'

import { DataNode } from 'src/types'
import { Markdown } from 'src/components'
import { computeColour } from 'src/lib/colours'
import { WindowSizeContext } from 'src/contexts'

interface Props {
  data: ScatterPlotRawSerie<DataNode>[]
  onMove: (move: [string, string]) => void
  onMouseEnter?: (node: any) => void
  onMouseLeave?: (node: any) => void
  currentMove?: [string, string] | null
  currentSquare?: string | null
  disabled?: boolean
}

export const MovePlot: React.FC<Props> = ({
  data = [],
  onMove,
  onMouseEnter,
  onMouseLeave,
  currentMove,
  currentSquare,
  disabled = false,
}: Props) => {
  const { isMobile } = useContext(WindowSizeContext)
  const handleMove = useCallback(
    ({ data: { move } }: any) => {
      const [from, to] = [move.slice(0, 2), move.slice(2, 4)]
      onMove([from, to])
    },
    [onMove],
  )

  return (
    <>
      <ResponsiveScatterPlot
        data={disabled ? [] : data}
        theme={{
          background: '#141414',
          textColor: 'white',
        }}
        margin={{ bottom: 36, right: 48, left: 30, top: 30 }}
        xScale={{ min: -4, max: -0.5, type: 'log', base: 2 }}
        yScale={{ min: 'auto', max: 'auto', type: 'linear' }}
        useMesh={false}
        enableGridX={false}
        enableGridY={false}
        axisTop={{
          tickValues: 0,
        }}
        axisLeft={{
          tickValues: 0,
        }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 0,
          tickValues: [-4, -2, -1],
          legend: 'SF eval loss (pawns)',
          legendPosition: 'middle',
          legendOffset: 24,
        }}
        axisRight={{
          tickSize: 5,
          tickPadding: 0,
          tickValues: isMobile ? 4 : 6,
          legend: 'Maia probability',
          legendPosition: 'middle',
          legendOffset: 36,
          format: (value) => `${Math.round(value * 100).toString()}%`,
        }}
        onClick={handleMove}
        tooltip={(props: ScatterPlotTooltipProps<any>) => {
          return (
            <div>
              <p>{props.node.data.san ?? props.node.data.move}</p>
            </div>
          )
        }}
        nodeSize={({ data: { nx, ny } }: any) => {
          return Math.abs(Math.asin((nx * ny + 3) / 4)) * 10
        }}
        nodeComponent={(props) => {
          const {
            node,
            blendMode,
            onMouseEnter,
            onMouseMove,
            onMouseLeave,
            onClick,
          } = props
          const { size } = props.node as any

          return (
            <circle
              fill={props.node.color}
              r={size / 2}
              cx={props.node.x}
              cy={props.node.y}
              style={{ mixBlendMode: blendMode }}
              onMouseEnter={(event) => onMouseEnter?.(node, event)}
              onMouseMove={(event) => onMouseMove?.(node, event)}
              onMouseLeave={(event) => onMouseLeave?.(node, event)}
              onClick={(event) => onClick?.(node, event)}
            />
          )
        }}
        colors={({ serieId }) => {
          const [nx, ny] = serieId
            .toString()
            .split(':')
            .map((x) => parseFloat(x))
          return computeColour(nx, ny)
        }}
        motionConfig="wobbly"
        animate={false}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      {disabled ? (
        <div className="absolute flex h-full w-full flex-1 flex-col items-center justify-center bg-background-1 p-2 text-center opacity-60">
          <Markdown>
            {`
##### MOVE MAP CURRENTLY DISABLED

Play an acceptable move or give up to unlock
`.trim()}
          </Markdown>
        </div>
      ) : undefined}
    </>
  )
}
