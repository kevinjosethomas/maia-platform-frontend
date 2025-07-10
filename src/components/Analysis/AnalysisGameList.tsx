import React, {
  useRef,
  useMemo,
  Dispatch,
  useState,
  useEffect,
  useContext,
  SetStateAction,
} from 'react'
import { motion } from 'framer-motion'
import { Tournament } from 'src/components'
import { AnalysisListContext } from 'src/contexts'
import { getAnalysisGameList } from 'src/api'
import { getCustomAnalysesAsWebGames } from 'src/utils/customAnalysis'

interface GameData {
  game_id: string
  maia_name: string
  result: string
  player_color: 'white' | 'black'
}

interface AnalysisGameListProps {
  currentId: string[] | null
  loadNewTournamentGame: (
    newId: string[],
    setCurrentMove?: Dispatch<SetStateAction<number>>,
  ) => Promise<void>
  loadNewLichessGames: (
    id: string,
    pgn: string,
    setCurrentMove?: Dispatch<SetStateAction<number>>,
  ) => Promise<void>
  loadNewUserGames: (
    id: string,
    type: 'play' | 'hand' | 'brain',
    setCurrentMove?: Dispatch<SetStateAction<number>>,
  ) => Promise<void>
  loadNewCustomGame: (
    id: string,
    setCurrentMove?: Dispatch<SetStateAction<number>>,
  ) => Promise<void>
  onCustomAnalysis?: () => void
  refreshTrigger?: number // Used to trigger refresh when custom analysis is added
}

export const AnalysisGameList: React.FC<AnalysisGameListProps> = ({
  currentId,
  loadNewTournamentGame,
  loadNewLichessGames,
  loadNewUserGames,
  loadNewCustomGame,
  onCustomAnalysis,
  refreshTrigger,
}) => {
  const {
    analysisPlayList,
    analysisHandList,
    analysisBrainList,
    analysisLichessList,
    analysisTournamentList,
  } = useContext(AnalysisListContext)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [localPlayGames, setLocalPlayGames] = useState(analysisPlayList)
  const [localHandGames, setLocalHandGames] = useState(analysisHandList)
  const [localBrainGames, setLocalBrainGames] = useState(analysisBrainList)
  const [customAnalyses, setCustomAnalyses] = useState(() => {
    if (typeof window !== 'undefined') {
      return getCustomAnalysesAsWebGames()
    }
    return []
  })
  const [hbSubsection, setHbSubsection] = useState<'hand' | 'brain'>('hand')

  useEffect(() => {
    setCustomAnalyses(getCustomAnalysesAsWebGames())
  }, [refreshTrigger])

  useEffect(() => {
    if (currentId?.[0]?.startsWith('custom-')) {
      setSelected('custom')
    }
  }, [currentId])

  const [fetchedCache, setFetchedCache] = useState<{
    [key: string]: { [page: number]: boolean }
  }>({
    play: {},
    hand: {},
    brain: {},
    lichess: {},
    tournament: {},
  })

  const [totalPagesCache, setTotalPagesCache] = useState<{
    [key: string]: number
  }>({})

  const [currentPagePerTab, setCurrentPagePerTab] = useState<{
    [key: string]: number
  }>({
    play: 1,
    hand: 1,
    brain: 1,
    lichess: 1,
    tournament: 1,
  })

  const listKeys = useMemo(() => {
    return analysisTournamentList
      ? Array.from(analysisTournamentList.keys()).sort(
          (a, b) =>
            b?.split('---')?.[1]?.localeCompare(a?.split('---')?.[1] ?? '') ??
            0,
        )
      : []
  }, [analysisTournamentList])

  const initialOpenIndex = useMemo(() => {
    if (analysisTournamentList && currentId) {
      return listKeys.map((m) => m?.split('---')?.[0]).indexOf(currentId[0])
    } else {
      return null
    }
  }, [analysisTournamentList, currentId, listKeys])

  const [selected, setSelected] = useState<
    'tournament' | 'lichess' | 'play' | 'hb' | 'custom'
  >(() => {
    // Check if currentId is a custom game (starts with 'custom-')
    if (currentId?.[0]?.startsWith('custom-')) {
      return 'custom' // Custom games are in the custom tab
    }
    // Check if it's one of the other specific types
    if (['lichess', 'play', 'hand', 'brain'].includes(currentId?.[1] ?? '')) {
      if (currentId?.[1] === 'hand' || currentId?.[1] === 'brain') {
        return 'hb'
      }
      return currentId?.[1] as 'lichess' | 'play'
    }

    return 'tournament'
  })
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpenIndex)

  const openElement = useRef<HTMLDivElement>(null)
  const selectedGameElement = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLoadingIndex(null)
  }, [selected])

  useEffect(() => {
    if (
      selected !== 'tournament' &&
      selected !== 'lichess' &&
      selected !== 'custom' &&
      selected !== 'hb'
    ) {
      const isAlreadyFetched = fetchedCache[selected]?.[currentPage]

      if (!isAlreadyFetched) {
        setLoading(true)

        setFetchedCache((prev) => ({
          ...prev,
          [selected]: { ...prev[selected], [currentPage]: true },
        }))

        getAnalysisGameList(selected, currentPage)
          .then((data) => {
            const parse = (
              game: {
                game_id: string
                maia_name: string
                result: string
                player_color: 'white' | 'black'
              },
              type: string,
            ) => {
              const raw = game.maia_name.replace('_kdd_', ' ')
              const maia = raw.charAt(0).toUpperCase() + raw.slice(1)

              return {
                id: game.game_id,
                label:
                  game.player_color === 'white'
                    ? `You vs. ${maia}`
                    : `${maia} vs. You`,
                result: game.result,
                type,
              }
            }

            const parsedGames = data.games.map((game: GameData) =>
              parse(game, selected),
            )
            const calculatedTotalPages =
              data.total_pages || Math.ceil(data.total_games / 100)

            setTotalPagesCache((prev) => ({
              ...prev,
              [selected]: calculatedTotalPages,
            }))

            if (selected === 'play') {
              setLocalPlayGames(parsedGames)
            }
            setLoading(false)
          })
          .catch(() => {
            setFetchedCache((prev) => {
              const newCache = { ...prev }
              delete newCache[selected][currentPage]
              return newCache
            })
            setLoading(false)
          })
      }
    }
  }, [selected, currentPage, fetchedCache])

  // Separate useEffect for H&B subsections
  useEffect(() => {
    if (selected === 'hb') {
      const gameType = hbSubsection === 'hand' ? 'hand' : 'brain'
      const isAlreadyFetched = fetchedCache[gameType]?.[currentPage]

      if (!isAlreadyFetched) {
        setLoading(true)

        setFetchedCache((prev) => ({
          ...prev,
          [gameType]: { ...prev[gameType], [currentPage]: true },
        }))

        getAnalysisGameList(gameType, currentPage)
          .then((data) => {
            const parse = (
              game: {
                game_id: string
                maia_name: string
                result: string
                player_color: 'white' | 'black'
              },
              type: string,
            ) => {
              const raw = game.maia_name.replace('_kdd_', ' ')
              const maia = raw.charAt(0).toUpperCase() + raw.slice(1)

              return {
                id: game.game_id,
                label:
                  game.player_color === 'white'
                    ? `You vs. ${maia}`
                    : `${maia} vs. You`,
                result: game.result,
                type,
              }
            }

            const parsedGames = data.games.map((game: GameData) =>
              parse(game, gameType),
            )
            const calculatedTotalPages =
              data.total_pages || Math.ceil(data.total_games / 100)

            setTotalPagesCache((prev) => ({
              ...prev,
              [gameType]: calculatedTotalPages,
            }))

            if (gameType === 'hand') {
              setLocalHandGames(parsedGames)
            } else if (gameType === 'brain') {
              setLocalBrainGames(parsedGames)
            }
            setLoading(false)
          })
          .catch(() => {
            setFetchedCache((prev) => {
              const newCache = { ...prev }
              delete newCache[gameType][currentPage]
              return newCache
            })
            setLoading(false)
          })
      }
    }
  }, [selected, hbSubsection, currentPage, fetchedCache])

  useEffect(() => {
    if (selected === 'hb') {
      const gameType = hbSubsection === 'hand' ? 'hand' : 'brain'
      if (totalPagesCache[gameType]) {
        setTotalPages(totalPagesCache[gameType])
      }
      setCurrentPage(currentPagePerTab[gameType])
    } else if (totalPagesCache[selected]) {
      setTotalPages(totalPagesCache[selected])
    } else if (
      selected === 'lichess' ||
      selected === 'tournament' ||
      selected === 'custom'
    ) {
      setTotalPages(1)
    }

    if (selected !== 'hb') {
      setCurrentPage(currentPagePerTab[selected])
    }
  }, [selected, hbSubsection, totalPagesCache, currentPagePerTab])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      if (selected === 'hb') {
        const gameType = hbSubsection === 'hand' ? 'hand' : 'brain'
        setCurrentPagePerTab((prev) => ({
          ...prev,
          [gameType]: newPage,
        }))
      } else {
        setCurrentPagePerTab((prev) => ({
          ...prev,
          [selected]: newPage,
        }))
      }
    }
  }

  const handleTabChange = (
    newTab: 'tournament' | 'play' | 'hb' | 'custom' | 'lichess',
  ) => {
    setSelected(newTab)
  }

  const getCurrentGames = () => {
    if (selected === 'play') {
      return localPlayGames
    } else if (selected === 'hb') {
      return hbSubsection === 'hand' ? localHandGames : localBrainGames
    } else if (selected === 'custom') {
      return customAnalyses
    } else if (selected === 'lichess') {
      return analysisLichessList
    }
    return []
  }

  return analysisTournamentList ? (
    <div
      id="analysis-game-list"
      className="flex h-full flex-col items-start justify-start overflow-hidden bg-background-1 md:rounded"
    >
      <div className="flex h-full w-full flex-col">
        <div className="grid select-none grid-cols-5 border-b-2 border-white border-opacity-10">
          <Header
            label="Play"
            name="play"
            selected={selected}
            setSelected={handleTabChange}
          />
          <Header
            label="H&B"
            name="hb"
            selected={selected}
            setSelected={handleTabChange}
          />
          <Header
            label="Custom"
            name="custom"
            selected={selected}
            setSelected={handleTabChange}
          />
          <Header
            label="Lichess"
            name="lichess"
            selected={selected}
            setSelected={handleTabChange}
          />
          <Header
            label="WC"
            name="tournament"
            selected={selected}
            setSelected={handleTabChange}
          />
        </div>

        {/* H&B Subsections */}
        {selected === 'hb' && (
          <div className="flex border-b border-white border-opacity-10">
            <button
              onClick={() => setHbSubsection('hand')}
              className={`flex-1 px-3 py-2 text-sm ${
                hbSubsection === 'hand'
                  ? 'bg-background-2 text-primary'
                  : 'bg-background-1/50 text-secondary hover:bg-background-2'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xs">
                  hand_gesture
                </span>
                <span className="text-xs">Hand ({localHandGames.length})</span>
              </div>
            </button>
            <button
              onClick={() => setHbSubsection('brain')}
              className={`flex-1 px-3 py-2 text-sm ${
                hbSubsection === 'brain'
                  ? 'bg-background-2 text-primary'
                  : 'bg-background-1/50 text-secondary hover:bg-background-2'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xs">
                  psychology
                </span>
                <span className="text-xs">
                  Brain ({localBrainGames.length})
                </span>
              </div>
            </button>
          </div>
        )}

        <div className="red-scrollbar flex h-full flex-col overflow-y-scroll">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {selected === 'tournament' ? (
                <>
                  {listKeys.map((id, i) => (
                    <Tournament
                      key={i}
                      id={id}
                      index={i}
                      openIndex={openIndex}
                      currentId={currentId}
                      openElement={
                        openElement as React.RefObject<HTMLDivElement>
                      }
                      setOpenIndex={setOpenIndex}
                      loadingIndex={loadingIndex}
                      setLoadingIndex={setLoadingIndex}
                      selectedGameElement={
                        selectedGameElement as React.RefObject<HTMLButtonElement>
                      }
                      loadNewTournamentGame={loadNewTournamentGame}
                      analysisTournamentList={analysisTournamentList}
                    />
                  ))}
                </>
              ) : (
                <>
                  {getCurrentGames().map((game, index) => {
                    const selectedGame = currentId && currentId[0] === game.id
                    return (
                      <button
                        key={index}
                        onClick={async () => {
                          setLoadingIndex(index)
                          if (game.type === 'pgn') {
                            await loadNewLichessGames(
                              game.id,
                              game.pgn as string,
                            )
                          } else if (
                            game.type === 'custom-pgn' ||
                            game.type === 'custom-fen'
                          ) {
                            await loadNewCustomGame(game.id)
                          } else {
                            await loadNewUserGames(
                              game.id,
                              game.type as 'play' | 'hand' | 'brain',
                            )
                          }
                          setLoadingIndex(null)
                        }}
                        className={`group flex w-full cursor-pointer items-center gap-2 pr-1 ${selectedGame ? 'bg-background-2 font-bold' : index % 2 === 0 ? 'bg-background-1/30 hover:bg-background-2' : 'bg-background-1/10 hover:bg-background-2'}`}
                      >
                        <div
                          className={`flex h-full w-9 items-center justify-center ${selectedGame ? 'bg-background-3' : 'bg-background-2 group-hover:bg-white/5'}`}
                        >
                          <p className="text-sm text-secondary">
                            {(currentPage - 1) * 100 + index + 1}
                          </p>
                        </div>
                        <div className="flex flex-1 items-center justify-between overflow-hidden py-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-primary">
                              {game.label}
                            </p>
                          </div>
                          <p className="whitespace-nowrap text-sm font-light text-secondary">
                            {game.result}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                  {(selected === 'play' || selected === 'hb') &&
                    totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">
                            first_page
                          </span>
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">
                            arrow_back_ios
                          </span>
                        </button>
                        <span className="text-sm text-secondary">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">
                            arrow_forward_ios
                          </span>
                        </button>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">
                            last_page
                          </span>
                        </button>
                      </div>
                    )}
                </>
              )}
            </>
          )}
          {!((selected === 'play' || selected === 'hb') && totalPages > 1) && (
            <div className="flex flex-1 items-start justify-center gap-1 py-2 md:items-center">
              <span className="material-symbols-outlined text-sm text-secondary">
                chess_pawn
              </span>
              <p className="text-xs text-secondary">Play more games...</p>
              <p className="ml-2 text-xs text-secondary">₍^. .^₎⟆</p>
            </div>
          )}
        </div>
        {onCustomAnalysis && (
          <button
            onClick={onCustomAnalysis}
            className="flex w-full items-center gap-2 bg-background-4/40 px-3 py-1.5 transition duration-200 hover:bg-background-4/80"
          >
            <span className="material-symbols-outlined text-xs text-secondary">
              add
            </span>
            <span className="text-xs text-secondary">
              Analyze Custom PGN/FEN
            </span>
          </button>
        )}
      </div>
    </div>
  ) : null
}

function Header({
  name,
  label,
  selected,
  setSelected,
}: {
  label: string
  name: 'tournament' | 'play' | 'hb' | 'custom' | 'lichess'
  selected: 'tournament' | 'play' | 'hb' | 'custom' | 'lichess'
  setSelected: (
    name: 'tournament' | 'play' | 'hb' | 'custom' | 'lichess',
  ) => void
}) {
  return (
    <button
      onClick={() => setSelected(name)}
      className={`relative flex items-center justify-center md:py-1 ${selected === name ? 'bg-human-4/30' : 'bg-background-1/80 hover:bg-background-2'} `}
    >
      <div className="flex items-center justify-start">
        <p
          className={`text-xs transition duration-200 ${selected === name ? 'text-human-2' : 'text-primary'}`}
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
