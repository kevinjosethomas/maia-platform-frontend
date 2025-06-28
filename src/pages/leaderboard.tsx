import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'

import {
  BrainIcon,
  HandIcon,
  RegularPlayIcon,
  TrainIcon,
  TuringIcon,
} from 'src/components/Icons/icons'
import { getLeaderboard } from 'src/api'
import { LeaderboardColumn } from 'src/components'

const Leaderboard: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [leaderboard, setLeaderboard] = useState<
    {
      icon: React.JSX.Element
      ranking: { display_name: string; elo: number }[]
      name: 'Regular' | 'Train' | 'Bot/Not' | 'Hand' | 'Brain'
      id: 'regular' | 'train' | 'turing' | 'hand' | 'brain'
    }[]
  >()
  const fetchLeaderboard = useCallback(async () => {
    const lb = await getLeaderboard()
    setLastUpdated(new Date(lb.last_updated + 'Z'))
    setLeaderboard([
      {
        id: 'regular',
        icon: <RegularPlayIcon />,
        name: 'Regular',
        ranking: lb.play_leaders,
      },
      {
        id: 'train',
        icon: <TrainIcon />,
        name: 'Train',
        ranking: lb.puzzles_leaders,
      },
      {
        id: 'turing',
        icon: <TuringIcon />,
        name: 'Bot/Not',
        ranking: lb.turing_leaders,
      },
      {
        id: 'hand',
        icon: <HandIcon />,
        name: 'Hand',
        ranking: lb.hand_leaders,
      },
      {
        id: 'brain',
        icon: <BrainIcon />,
        name: 'Brain',
        ranking: lb.brain_leaders,
      },
    ])
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return (
    <div className="mx-auto flex h-full w-[90%] flex-col items-start justify-center gap-8 py-[2%]">
      <Head>
        <title>Leaderboard – Maia Chess</title>
        <meta
          name="description"
          content="Top users across all Maia Chess leaderboards"
        />
      </Head>
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold">Rating Leaderboards</h1>
        <p>
          Last Updated:{' '}
          {lastUpdated
            ? lastUpdated.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : '...'}
        </p>
      </div>
      <div className="grid h-full w-full grid-cols-1 justify-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaderboard?.map((column, index) => (
          <LeaderboardColumn key={index} {...column} />
        ))}
      </div>
    </div>
  )
}

const LeaderboardPage: React.FC = () => {
  return (
    <>
      <Leaderboard />
    </>
  )
}

export default LeaderboardPage
