import { motion } from 'framer-motion'
import React, { useState } from 'react'
import { ConfigureAnalysis } from 'src/components/Analysis/ConfigureAnalysis'
import { ExportGame } from 'src/components/Misc/ExportGame'
import { AnalyzedGame, GameNode } from 'src/types'

interface Props {
  currentMaiaModel: string
  setCurrentMaiaModel: (model: string) => void
  launchContinue: () => void
  MAIA_MODELS: string[]
  game: AnalyzedGame
  currentNode: GameNode
  onDeleteCustomGame?: () => void
}

export const ConfigurableScreens: React.FC<Props> = ({
  currentMaiaModel,
  setCurrentMaiaModel,
  launchContinue,
  MAIA_MODELS,
  game,
  currentNode,
  onDeleteCustomGame,
}) => {
  const screens = [
    {
      id: 'configure',
      name: 'Configure',
    },
    {
      id: 'export',
      name: 'Export',
    },
  ]

  const [screen, setScreen] = useState(screens[0])

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden bg-background-1/60 md:w-auto md:rounded">
      <div className="flex flex-row border-b border-white/10">
        {screens.map((s) => {
          const selected = s.id === screen.id
          return (
            <div
              key={s.id}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => {
                if (e.key === 'Enter') setScreen(s)
              }}
              onClick={() => setScreen(s)}
              className={`relative flex cursor-pointer select-none flex-row px-3 py-1.5 ${selected ? 'bg-white/5' : 'hover:bg-white hover:bg-opacity-[0.02]'} transition duration-200`}
            >
              <p
                className={`text-sm transition duration-200 ${selected ? 'text-primary' : 'text-secondary'} `}
              >
                {s.name}
              </p>
              {selected ? (
                <motion.div
                  layoutId="selectedScreen"
                  className="absolute bottom-0 left-0 h-[1px] w-full bg-white"
                />
              ) : null}
            </div>
          )
        })}
      </div>
      <div className="red-scrollbar flex flex-col items-start justify-start overflow-y-scroll bg-backdrop/30">
        {screen.id === 'configure' ? (
          <ConfigureAnalysis
            currentMaiaModel={currentMaiaModel}
            setCurrentMaiaModel={setCurrentMaiaModel}
            launchContinue={launchContinue}
            MAIA_MODELS={MAIA_MODELS}
            game={game}
            onDeleteCustomGame={onDeleteCustomGame}
          />
        ) : screen.id === 'export' ? (
          <div className="flex w-full flex-col p-4">
            <ExportGame
              game={game}
              currentNode={currentNode}
              whitePlayer={game.whitePlayer.name}
              blackPlayer={game.blackPlayer.name}
              event="Analysis"
              type="analysis"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
