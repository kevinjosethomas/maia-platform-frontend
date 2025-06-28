import { useContext } from 'react'

import { ModalContext } from 'src/contexts'
import { InstructionsType } from 'src/components'

interface Props {
  icon: string
  title: string
  type: InstructionsType
  children: React.ReactNode
  currentMaiaModel?: string
  setCurrentMaiaModel?: (model: string) => void
  MAIA_MODELS?: string[]
  showGameListButton?: boolean
  onGameListClick?: () => void
}

export const GameInfo: React.FC<Props> = ({
  icon,
  title,
  type,
  children,
  currentMaiaModel,
  setCurrentMaiaModel,
  MAIA_MODELS,
  showGameListButton,
  onGameListClick,
}: Props) => {
  const { setInstructionsModalProps } = useContext(ModalContext)

  return (
    <div className="flex w-full flex-col items-start justify-start gap-1 overflow-hidden bg-background-1 p-3 md:rounded">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center justify-start gap-1.5">
          <span className="material-symbols-outlined text-xl">{icon}</span>
          <h2 className="text-xl font-semibold">{title}</h2>
          {currentMaiaModel && setCurrentMaiaModel && (
            <p className="flex items-center gap-1 text-sm md:hidden">
              using
              <div className="relative inline-flex items-center gap-0.5">
                <select
                  value={currentMaiaModel}
                  className="cursor-pointer appearance-none bg-transparent focus:outline-none"
                  onChange={(e) => setCurrentMaiaModel(e.target.value)}
                >
                  {MAIA_MODELS?.map((model) => (
                    <option value={model} key={model}>
                      {model.replace('maia_kdd_', 'Maia ')}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none text-sm">
                  arrow_drop_down
                </span>
              </div>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showGameListButton && (
            <button
              className="flex items-center gap-1 rounded bg-human-4/30 px-2 py-1 text-sm text-human-2 duration-200 hover:bg-human-4/50 md:hidden"
              onClick={onGameListClick}
            >
              <span className="material-symbols-outlined text-sm">
                format_list_bulleted
              </span>
              <span>Switch Game</span>
            </button>
          )}
          <button
            className="material-symbols-outlined duration-200 hover:text-human-3"
            onClick={() => {
              setInstructionsModalProps({ instructionsType: type })
            }}
          >
            help
          </button>
        </div>
      </div>
      <div className="flex w-full flex-col">{children}</div>
    </div>
  )
}
