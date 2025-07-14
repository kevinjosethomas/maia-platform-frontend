import React from 'react'

interface Props {
  icon: React.JSX.Element
  name: string
  data: {
    rating: number
    highest: number
    hours: number
    games: number
    wins: number
    draws?: number
    losses?: number
  }
}

export const ProfileColumn: React.FC<Props> = ({ icon, name, data }: Props) => {
  const wins = data.wins
  const draws = data.draws ?? 0
  const losses = data.losses ?? data.games - data.wins - (data?.draws || 0)

  return (
    <div className="flex w-full flex-col overflow-hidden rounded border border-white border-opacity-10">
      <div className="flex flex-row items-center justify-start gap-3 bg-background-1 px-4 py-3">
        <div className="h-[20px] w-[20px] md:h-[24px] md:w-[24px]">{icon}</div>
        <p className="text-xl font-bold md:text-2xl">{name}</p>
      </div>
      <div className="flex flex-col gap-4 bg-background-1/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center justify-center gap-1 text-human-1">
            <p className="text-sm xl:text-base">Rating</p>
            <b className="text-xl xl:text-2xl">{data.rating}</b>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-sm xl:text-base">Highest</p>
            <b className="text-xl xl:text-2xl">{data.highest}</b>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-sm xl:text-base">Games</p>
            <b className="text-xl xl:text-2xl">{data.games}</b>
          </div>
          {/* <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-sm xl:text-base">Hours</p>
            <b className="text-xl xl:text-2xl">{data.hours}</b>
          </div> */}
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 border border-black bg-green-500/70" />
              <p className="text-xs">
                Wins: {wins}{' '}
                <span className="text-secondary">
                  ({Math.round((wins * 100) / data.games) || 0}%)
                </span>
              </p>
            </div>
            {draws > 0 ? (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 border border-black bg-yellow-500/70" />
                <p className="text-xs">
                  Draws: {draws}{' '}
                  <span className="text-secondary">
                    ({Math.round((draws * 100) / data.games) || 0}%)
                  </span>
                </p>
              </div>
            ) : (
              <></>
            )}
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 border border-black bg-red-500/70" />
              <p className="text-xs">
                Losses: {losses}{' '}
                <span className="text-secondary">
                  ({Math.round((losses * 100) / data.games) || 0}%)
                </span>
              </p>
            </div>
          </div>
          <div className="flex h-6 w-full border border-black">
            {wins > 0 && (
              <div
                className="h-full border-r border-black bg-green-500/70"
                style={{ width: `${(wins / data.games) * 100}%` }}
              />
            )}

            {draws > 0 && (
              <div
                className="h-full border-r border-black bg-yellow-500/70"
                style={{ width: `${(draws / data.games) * 100}%` }}
              />
            )}
            {losses > 0 && (
              <div
                className="h-full bg-red-500/70"
                style={{ width: `${(losses / data.games) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
