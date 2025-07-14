import { useState, useEffect, useContext } from 'react'

import { Color } from 'src/types'
import { AuthContext } from 'src/contexts'
import { PlayControllerContext } from 'src/contexts/PlayControllerContext/PlayControllerContext'

interface Props {
  player: Color
  reversed: boolean
}

export const GameClock: React.FC<Props> = (
  props: React.PropsWithChildren<Props>,
) => {
  const { user } = useContext(AuthContext)
  const { player, toPlay, whiteClock, blackClock, lastMoveTime } = useContext(
    PlayControllerContext,
  )

  const [referenceTime, setReferenceTime] = useState<number>(Date.now())

  const playerClock = props.player == 'white' ? whiteClock : blackClock
  const active = toPlay == props.player

  const clock = Math.max(
    active && lastMoveTime > 0
      ? playerClock - referenceTime + lastMoveTime
      : playerClock,
    0,
  )

  useEffect(() => {
    setReferenceTime(Date.now())

    if (active) {
      const interval = setInterval(() => setReferenceTime(Date.now()), 50)
      return () => clearInterval(interval)
    }

    return () => undefined
  }, [active, setReferenceTime])

  const minutes = Math.floor(clock / 60000)
  const seconds = Math.floor(clock / 1000) - minutes * 60
  const tenths = Math.floor(clock / 100) - seconds * 10 - minutes * 600

  const showTenths = minutes < 1 && seconds <= 20

  return (
    <div
      className={`flex items-center justify-between bg-background-1 md:items-start md:justify-start ${active ? 'opacity-100' : 'opacity-50'} flex-row md:flex-col`}
    >
      <div className="px-4 py-2">
        {props.player == 'black' ? '●' : '○'}{' '}
        {player == props.player ? user?.displayName : 'Maia'}
      </div>
      <div className="inline-flex self-start px-4 py-2 md:text-3xl">
        {minutes}:{('00' + seconds).slice(-2)}
        {showTenths ? '.' + tenths : null}
      </div>
    </div>
  )
}
