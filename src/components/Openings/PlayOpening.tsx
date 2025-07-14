import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState, useCallback } from 'react'

import { Opening, OpeningVariation } from 'src/types'
import { MAIA_MODELS_WITH_NAMES } from 'src/constants/common'

const TIME_CONTROLS = [
  {
    id: '3+0',
    name: '3+0',
  },
  {
    id: '5+2',
    name: '5+2',
  },
  {
    id: '10+0',
    name: '10+0',
  },
  {
    id: '15+10',
    name: '15+10',
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
  },
]

const MAIA_TIME_CONTROL = [
  {
    id: 'instant',
    name: 'Instant',
  },
  {
    id: 'human',
    name: 'Human-like',
  },
]

interface Props {
  selectedOpening: Opening
  selectedVariation: OpeningVariation | null
  setOrientation: (orientation: 'white' | 'black') => void
}

export const PlayOpening: React.FC<Props> = ({
  selectedOpening,
  selectedVariation,
  setOrientation,
}: Props) => {
  const { push } = useRouter()
  const [version, setVersion] = useState(MAIA_MODELS_WITH_NAMES[0])
  const [timeControl, setTimeControl] = useState(TIME_CONTROLS[0])
  const [maiaTimeControl, setMaiaTimeControl] = useState(MAIA_TIME_CONTROL[0])
  const [color, setColor] = useState<'white' | 'black' | 'random'>('random')

  const start = useCallback(() => {
    const player =
      color === 'random'
        ? ['white', 'black'][Math.floor(Math.random() * 2)]
        : color

    const url = new URL('/play/maia', window.location.origin)
    url.searchParams.append('player', player)
    url.searchParams.append('maiaVersion', version.id)
    url.searchParams.append('timeControl', timeControl.id)
    url.searchParams.append('sampleMoves', 'true')
    url.searchParams.append(
      'simulateMaiaTime',
      maiaTimeControl.id === 'human' ? 'true' : 'false',
    )
    url.searchParams.append(
      'startFen',
      selectedVariation ? selectedVariation.fen : selectedOpening.fen,
    )

    window.open(url.toString(), '_blank')
  }, [
    push,
    color,
    version,
    timeControl,
    maiaTimeControl,
    selectedOpening,
    selectedVariation,
  ])

  return (
    <div className="flex flex-col items-center gap-6 overflow-hidden border border-white border-opacity-5 bg-background-1 md:rounded">
      <div className="flex w-full flex-col items-center gap-4 py-4">
        <p className="text-sm font-medium text-secondary">
          PRACTICE AGAINST MAIA
        </p>
        <VersionPicker version={version} setVersion={setVersion} />
        <Switcher
          label="Maia Time Use:"
          options={MAIA_TIME_CONTROL}
          selected={maiaTimeControl}
          setSelected={setMaiaTimeControl}
        />
        <Switcher
          label="Time Control:"
          options={TIME_CONTROLS}
          selected={timeControl}
          setSelected={setTimeControl}
        />
      </div>
      <div className="flex w-full flex-col gap-4">
        <ColorPicker
          color={color}
          setColor={setColor}
          setOrientation={setOrientation}
        />
        <button
          onClick={start}
          className="flex w-full items-center justify-center gap-1.5 bg-human-4 px-3 py-2 hover:bg-human-4/80"
        >
          <span className="material-symbols-outlined text-base">swords</span>
          <span>Play opening against {version.name}</span>
        </button>
      </div>
    </div>
  )
}

function VersionPicker({
  version,
  setVersion,
}: {
  version: { id: string; name: string }
  setVersion: (version: { id: string; name: string }) => void
}) {
  return (
    <div className="flex w-full flex-col gap-0.5 px-4">
      <p className="text-sm text-secondary">Select opponent:</p>
      <select
        value={version.id}
        className="rounded-sm bg-human-4/60 p-2 text-sm focus:outline-none"
        onChange={(e) =>
          setVersion(
            MAIA_MODELS_WITH_NAMES.find(
              (version) => version.id === e.target.value,
            ) as {
              id: string
              name: string
            },
          )
        }
      >
        {MAIA_MODELS_WITH_NAMES.map((version) => (
          <option key={version.id} value={version.id} className="text-sm">
            {version.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function Switcher({
  label,
  options,
  selected,
  setSelected,
}: {
  label: string
  options: { id: string; name: string }[]
  selected: { id: string; name: string }
  setSelected: (selected: { id: string; name: string }) => void
}) {
  return (
    <div className="flex w-full flex-col gap-0.5 px-4">
      <p className="text-sm text-secondary">{label}</p>
      <div className="flex w-full flex-row overflow-hidden rounded-sm bg-background-2/80">
        {options.map((option, index) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <div
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(option)}
            className={`flex flex-1 cursor-pointer items-center justify-center px-2 py-1.5 ${selected.id === option.id ? 'bg-human-4/60' : 'hover:bg-human-4/10'}`}
          >
            <p className="select-none text-sm">{option.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorPicker({
  color,
  setColor,
  setOrientation,
}: {
  color: string
  setColor: (color: 'white' | 'black' | 'random') => void
  setOrientation: (orientation: 'white' | 'black') => void
}) {
  return (
    <div className="flex w-full items-end justify-center gap-2">
      <button
        title="Play as black"
        onClick={() => {
          setColor('black')
          setOrientation('black')
        }}
        className={`flex cursor-pointer select-none items-center justify-center rounded-sm p-2 ${color === 'black' ? 'bg-human-2/40' : 'bg-human-2/10 hover:bg-human-2/20'}`}
      >
        <div className="relative h-12 w-12">
          <Image src="/assets/pieces/black king.svg" fill={true} alt="" />
        </div>
      </button>
      <button
        title="Play as random colour"
        onClick={() => setColor('random')}
        className={`flex cursor-pointer select-none items-center justify-center rounded-sm p-4 ${color === 'random' ? 'bg-human-2/40' : 'bg-human-2/10 hover:bg-human-2/20'}`}
      >
        <div className="relative h-14 w-14">
          <Image alt="" fill={true} src="/assets/pieces/white black king.svg" />
        </div>
      </button>
      <button
        title="Play as white"
        onClick={() => {
          setColor('white')
          setOrientation('white')
        }}
        className={`flex cursor-pointer select-none items-center justify-center rounded-sm p-2 ${color === 'white' ? 'bg-human-2/40' : 'bg-human-2/10 hover:bg-human-2/20'}`}
      >
        <div className="relative h-12 w-12">
          <Image src="/assets/pieces/white king.svg" fill={true} alt="" />
        </div>
      </button>
    </div>
  )
}
