import { motion } from 'framer-motion'
import React, { useState, useEffect, useContext } from 'react'

import { AuthContext } from 'src/contexts'
import { AnalysisWebGame } from 'src/types'
import { getLichessGames, getAnalysisGameList } from 'src/api'

interface GameData {
  game_id: string
  maia_name: string
  result: string
  player_color: 'white' | 'black'
}

export const GameList = () => {
  const { user } = useContext(AuthContext)
  const [selected, setSelected] = useState<'play' | 'hand' | 'brain' | 'pgn'>(
    'play',
  )
  const [games, setGames] = useState<AnalysisWebGame[]>([])
  const [playGames, setPlayGames] = useState<AnalysisWebGame[]>([])
  const [handGames, setHandGames] = useState<AnalysisWebGame[]>([])
  const [brainGames, setBrainGames] = useState<AnalysisWebGame[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [fetchedCache, setFetchedCache] = useState<{
    [key: string]: { [page: number]: boolean }
  }>({
    play: {},
    hand: {},
    brain: {},
    pgn: {},
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
    pgn: 1,
  })

  useEffect(() => {
    if (user?.lichessId && !fetchedCache.pgn[1]) {
      setFetchedCache((prev) => ({
        ...prev,
        pgn: { ...prev.pgn, 1: true },
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
  }, [user?.lichessId, fetchedCache.pgn])

  useEffect(() => {
    if (user?.lichessId && selected !== 'pgn') {
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
            const calculatedTotalPages = Math.ceil(data.total / 100)

            setTotalPagesCache((prev) => ({
              ...prev,
              [selected]: calculatedTotalPages,
            }))

            if (selected === 'play') {
              setPlayGames((prev) =>
                currentPage === 1 ? parsedGames : [...prev, ...parsedGames],
              )
            } else if (selected === 'hand') {
              setHandGames((prev) =>
                currentPage === 1 ? parsedGames : [...prev, ...parsedGames],
              )
            } else if (selected === 'brain') {
              setBrainGames((prev) =>
                currentPage === 1 ? parsedGames : [...prev, ...parsedGames],
              )
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
  }, [user?.lichessId, selected, currentPage, fetchedCache])

  useEffect(() => {
    if (totalPagesCache[selected]) {
      setTotalPages(totalPagesCache[selected])
    } else if (selected === 'pgn') {
      setTotalPages(1)
    }

    setCurrentPage(currentPagePerTab[selected])
  }, [selected, totalPagesCache, currentPagePerTab])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      setCurrentPagePerTab((prev) => ({
        ...prev,
        [selected]: newPage,
      }))
    }
  }

  const handleTabChange = (newTab: 'play' | 'hand' | 'brain' | 'pgn') => {
    setSelected(newTab)
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
          label="Hand"
          name="hand"
          selected={selected}
          setSelected={handleTabChange}
        />
        <Header
          label="Brain"
          name="brain"
          selected={selected}
          setSelected={handleTabChange}
        />
        <Header
          label="Lichess"
          name="pgn"
          selected={selected}
          setSelected={handleTabChange}
        />
      </div>
      <div className="red-scrollbar flex max-h-64 flex-col overflow-y-scroll md:max-h-[60vh]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {(selected === 'play'
              ? playGames
              : selected === 'hand'
                ? handGames
                : selected === 'brain'
                  ? brainGames
                  : games
            ).map((game, index) => (
              <a
                key={index}
                href={`/analysis/${game.id}/${selected}`}
                className={`group flex w-full cursor-pointer items-center gap-2 pr-1 ${index % 2 === 0 ? 'bg-background-1/30' : 'bg-background-1/10'} hover:bg-background-2`}
              >
                <div className="flex h-full w-9 items-center justify-center bg-background-2 py-1 group-hover:bg-white/5">
                  <p className="text-sm text-secondary">{index + 1}</p>
                </div>
                <div className="flex flex-1 items-center justify-between overflow-hidden py-1">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-primary">
                    {game.label}
                  </p>
                  <p className="whitespace-nowrap text-sm font-light text-secondary">
                    {game.result}
                  </p>
                </div>
              </a>
            ))}
            {selected !== 'pgn' && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-2">
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
                  <span className="material-symbols-outlined">last_page</span>
                </button>
              </div>
            )}
          </>
        )}
        <div className="flex flex-1 items-start justify-center gap-1 py-2 md:items-center">
          <span className="material-symbols-outlined text-sm text-secondary">
            chess_pawn
          </span>
          <p className="text-xs text-secondary">Play more games...</p>
          <p className="ml-2 text-xs text-secondary">₍^. .^₎⟆</p>
        </div>
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
  name: 'play' | 'hand' | 'brain' | 'pgn'
  selected: 'play' | 'hand' | 'brain' | 'pgn'
  setSelected: (name: 'play' | 'hand' | 'brain' | 'pgn') => void
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
