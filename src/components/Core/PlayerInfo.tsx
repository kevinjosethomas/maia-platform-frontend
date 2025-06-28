interface PlayerInfoProps {
  name: string
  color: string
  rating?: number
  termination?: string
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  name,
  rating,
  color,
  termination,
}) => {
  return (
    <div className="flex h-10 w-full items-center justify-between bg-background-1 px-4">
      <div className="flex items-center gap-1.5">
        <div
          className={`h-2.5 w-2.5 rounded-full ${color === 'white' ? 'bg-white' : 'border bg-black'}`}
        />
        <p>
          {name ?? 'Unknown'} {rating ? `(${rating})` : null}
        </p>
      </div>
      {termination === color ? (
        <p className="text-engine-3">1</p>
      ) : termination !== 'none' ? (
        <p className="text-human-3">0</p>
      ) : termination === undefined ? (
        <></>
      ) : (
        <p>1/2</p>
      )}
    </div>
  )
}
