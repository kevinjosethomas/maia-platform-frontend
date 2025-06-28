import { motion } from 'framer-motion'
import { SetStateAction, Dispatch } from 'react'

import { AnalysisWebGame } from 'src/types'

interface Props {
  currentId: string[] | null
  playGames: AnalysisWebGame[]
  handGames: AnalysisWebGame[]
  brainGames: AnalysisWebGame[]
  lichessGames: AnalysisWebGame[]
  selected: 'tournament' | 'play' | 'hand' | 'brain' | 'pgn'
  setSelected: (name: 'tournament' | 'play' | 'hand' | 'brain' | 'pgn') => void
  setCurrentIndex: Dispatch<SetStateAction<number>>
  setLoadingIndex: (index: number | null) => void
  loadNewLichessGame: (
    id: string,
    pgn: string,
    currentMaiaModel: string,
    setCurrentMove?: Dispatch<SetStateAction<number>>,
  ) => void
  loadNewUserGame: (
    id: string,
    type: 'play' | 'hand' | 'brain',
    currentMaiaModel: string,
    setCurrentMove?: Dispatch<SetStateAction<number>>,
  ) => void
  currentMaiaModel: string
}

export const UserGameList = ({
  currentId,
  selected,
  setSelected,
  playGames,
  handGames,
  brainGames,
  lichessGames,
  setLoadingIndex,
  setCurrentIndex,
  loadNewLichessGame,
  loadNewUserGame,
  currentMaiaModel,
}: Props) => {
  return (
    <div className="flex w-full flex-col">
      <div className="grid select-none grid-cols-4 border-b-2 border-white border-opacity-10">
        <Header
          label="Play"
          name="play"
          selected={selected}
          setSelected={setSelected}
        />
        <Header
          label="Hand"
          name="hand"
          selected={selected}
          setSelected={setSelected}
        />
        <Header
          label="Brain"
          name="brain"
          selected={selected}
          setSelected={setSelected}
        />
        <Header
          label="Lichess"
          name="pgn"
          selected={selected}
          setSelected={setSelected}
        />
      </div>
      <div className="red-scrollbar flex max-h-64 flex-col overflow-y-scroll md:max-h-[60vh]">
        {(selected === 'play'
          ? playGames
          : selected === 'hand'
            ? handGames
            : selected === 'brain'
              ? brainGames
              : lichessGames
        ).map((game, index) => {
          const selectedGame = currentId && currentId[0] === game.id
          return (
            <button
              key={index}
              onClick={async () => {
                setLoadingIndex(index)
                if (game.type === 'pgn') {
                  await loadNewLichessGame(
                    game.id,
                    game.pgn as string,
                    currentMaiaModel,
                    setCurrentIndex,
                  )
                } else {
                  await loadNewUserGame(
                    game.id,
                    game.type as 'play' | 'hand' | 'brain',
                    currentMaiaModel,
                    setCurrentIndex,
                  )
                }
                setLoadingIndex(null)
              }}
              className={`group flex w-full cursor-pointer items-center gap-2 pr-2 ${selectedGame ? 'bg-background-2 font-bold' : index % 2 === 0 ? 'bg-background-1/30 hover:bg-background-2' : 'bg-background-1/10 hover:bg-background-2'}`}
            >
              <div
                className={`flex h-full w-10 items-center justify-center py-1 ${selectedGame ? 'bg-background-3' : 'bg-background-2 group-hover:bg-white/5'}`}
              >
                <p className="text-secondary">{index + 1}</p>
              </div>
              <div className="flex flex-1 items-center justify-between overflow-hidden py-1">
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-primary">
                  {game.label}
                </p>
                <p className="whitespace-nowrap text-secondary">
                  {game.result}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Header({
  name,
  label,
  selected,
  setSelected,
}: {
  label: string
  name: 'tournament' | 'play' | 'hand' | 'brain' | 'pgn'
  selected: 'tournament' | 'play' | 'hand' | 'brain' | 'pgn'
  setSelected: (name: 'tournament' | 'play' | 'hand' | 'brain' | 'pgn') => void
}) {
  return (
    <button
      onClick={() => setSelected(name)}
      className={`relative flex items-center justify-center py-0.5 ${selected === name ? 'bg-human-4/30' : 'bg-background-1/80 hover:bg-background-2'} transition duration-200`}
    >
      <div className="flex items-center justify-start gap-1">
        <p
          className={`text-sm transition duration-200 ${selected === name ? 'text-human-2' : 'text-primary'}`}
        >
          {label}
        </p>
        <i
          className={`material-symbols-outlined text-base transition duration-200 ${selected === name ? 'text-human-2/80' : 'text-primary/80'}`}
        >
          keyboard_arrow_down
        </i>
      </div>
      {selected === name && (
        <motion.div
          layoutId="underline"
          className="absolute -bottom-0.5 h-0.5 w-full bg-human-2/80"
        ></motion.div>
      )}
    </button>
  )
}
