import { motion } from 'framer-motion'
import React, { useState, useEffect, useContext } from 'react'

import { AuthContext } from 'src/contexts'
import { AnalysisWebGame } from 'src/types'
import { getLichessGames, getAnalysisGameList } from 'src/api'
import { getCustomAnalysesAsWebGames } from 'src/lib/customAnalysis'

interface GameData {
  game_id: string
  maia_name: string
  result: string
  player_color: 'white' | 'black'
}

export const GameList = () => {
  const { user } = useContext(AuthContext)
  const [selected, setSelected] = useState<
    'play' | 'hb' | 'custom' | 'lichess'
  >('play')
  const [hbSubsection, setHbSubsection] = useState<'hand' | 'brain'>('hand')
  const [games, setGames] = useState<AnalysisWebGame[]>([])
  const [playGames, setPlayGames] = useState<AnalysisWebGame[]>([])
  const [handGames, setHandGames] = useState<AnalysisWebGame[]>([])
  const [brainGames, setBrainGames] = useState<AnalysisWebGame[]>([])
  const [customAnalyses, setCustomAnalyses] = useState(() => {
    if (typeof window !== 'undefined') {
      return getCustomAnalysesAsWebGames()
    }
    return []
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [fetchedCache, setFetchedCache] = useState<{
    [key: string]: { [page: number]: boolean }
  }>({
    play: {},
    hand: {},
    brain: {},
    lichess: {},
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
  })

  // Update custom analyses when component mounts
  useEffect(() => {
    setCustomAnalyses(getCustomAnalysesAsWebGames())
  }, [])

  useEffect(() => {
    if (user?.lichessId && !fetchedCache.lichess[1]) {
      setFetchedCache((prev) => ({
        ...prev,
        lichess: { ...prev.lichess, 1: true },
      }))

      getLichessGames(user?.lichessId, (data) => {
        const result = data.pgn.match(/\[Result\s+"(.+?)"\]/)[1] || '?'

        const game: AnalysisWebGame = {
          id: data.id,
          label: `${data.players.white.user?.id || 'Unknown'} vs. ${data.players.black.user?.id || 'Unknown'}`,
          result: result,
          type: 'pgn',
        }

        setGames((x) => [...x, game])
      })
    }
  }, [user?.lichessId, fetchedCache.lichess])

  useEffect(() => {
    if (user?.lichessId && selected !== 'lichess' && selected !== 'custom') {
      const gameType = selected === 'hb' ? hbSubsection : selected
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

            if (gameType === 'play') {
              setPlayGames(parsedGames)
            } else if (gameType === 'hand') {
              setHandGames(parsedGames)
            } else if (gameType === 'brain') {
              setBrainGames(parsedGames)
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
  }, [user?.lichessId, selected, hbSubsection, currentPage, fetchedCache])

  useEffect(() => {
    if (selected === 'hb') {
      const gameType = hbSubsection
      if (totalPagesCache[gameType]) {
        setTotalPages(totalPagesCache[gameType])
      }
      setCurrentPage(currentPagePerTab[gameType])
    } else if (totalPagesCache[selected]) {
      setTotalPages(totalPagesCache[selected])
    } else if (selected === 'lichess' || selected === 'custom') {
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
        const gameType = hbSubsection
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

  const handleTabChange = (newTab: 'play' | 'hb' | 'custom' | 'lichess') => {
    setSelected(newTab)
  }

  const getCurrentGames = () => {
    if (selected === 'play') {
      return playGames
    } else if (selected === 'hb') {
      return hbSubsection === 'hand' ? handGames : brainGames
    } else if (selected === 'custom') {
      return customAnalyses
    } else if (selected === 'lichess') {
      return games
    }
    return []
  }

  return (
    <div className="flex w-full flex-col overflow-hidden rounded border border-white border-opacity-10 md:w-[600px]">
      <div className="flex flex-row items-center justify-start gap-4 border-b border-white border-opacity-10 bg-background-1 px-2 py-3 md:px-4">
        <p className="text-xl font-bold md:text-xl">Your Games</p>
      </div>
      <div className="grid select-none grid-cols-4 border-b-2 border-white border-opacity-10">
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
      </div>

      {/* H&B Subsections */}
      {selected === 'hb' && (
        <div className="flex border-b border-white border-opacity-10">
          <button
            onClick={() => setHbSubsection('hand')}
            className={`flex-1 px-3 py-1.5 text-sm ${
              hbSubsection === 'hand'
                ? 'bg-background-2 text-primary'
                : 'bg-background-1/50 text-secondary hover:bg-background-2'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xs">
                hand_gesture
              </span>
              <span className="text-xs">Hand ({handGames.length})</span>
            </div>
          </button>
          <button
            onClick={() => setHbSubsection('brain')}
            className={`flex-1 px-3 py-1.5 text-sm ${
              hbSubsection === 'brain'
                ? 'bg-background-2 text-primary'
                : 'bg-background-1/50 text-secondary hover:bg-background-2'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xs">
                psychology
              </span>
              <span className="text-xs">Brain ({brainGames.length})</span>
            </div>
          </button>
        </div>
      )}

      <div className="red-scrollbar flex max-h-64 flex-col overflow-y-scroll md:max-h-96">
        {loading ? (
          <div className="flex h-full items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {getCurrentGames().map((game, index) => (
              <a
                key={index}
                href={`/analysis/${game.id}/${game.type}`}
                className={`group flex w-full cursor-pointer items-center gap-2 pr-2 ${
                  index % 2 === 0
                    ? 'bg-background-1/30 hover:bg-background-2'
                    : 'bg-background-1/10 hover:bg-background-2'
                }`}
              >
                <div className="flex h-full w-10 items-center justify-center bg-background-2 py-1 group-hover:bg-white/5">
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
                  <p className="whitespace-nowrap text-sm text-secondary">
                    {game.result}
                  </p>
                </div>
              </a>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {(selected === 'play' || selected === 'hb') && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-white border-opacity-10 bg-background-1 py-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined">first_page</span>
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <span className="text-sm text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center text-secondary hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined">last_page</span>
          </button>
        </div>
      )}
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
  name: 'play' | 'hb' | 'custom' | 'lichess'
  selected: 'play' | 'hb' | 'custom' | 'lichess'
  setSelected: (name: 'play' | 'hb' | 'custom' | 'lichess') => void
}) {
  return (
    <button
      onClick={() => setSelected(name)}
      className={`relative flex items-center justify-center py-0.5 ${
        selected === name
          ? 'bg-human-4/30'
          : 'bg-background-1/80 hover:bg-background-2'
      } transition duration-200`}
    >
      <div className="flex items-center justify-start gap-1">
        <p
          className={`text-sm transition duration-200 ${
            selected === name ? 'text-human-2' : 'text-primary'
          }`}
        >
          {label}
        </p>
        <i
          className={`material-symbols-outlined text-base transition duration-200 ${
            selected === name ? 'text-human-2/80' : 'text-primary/80'
          }`}
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
