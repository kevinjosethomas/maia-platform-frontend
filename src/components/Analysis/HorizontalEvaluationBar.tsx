interface Props {
  min?: number
  max?: number
  value?: number
  label?: string
}

export const HorizontalEvaluationBar: React.FC<Props> = ({
  min = 0,
  max = 1,
  value,
  label,
}: Props) => {
  let width = (((value ?? min) - min) / (max - min)) * 100
  width = Math.max(0, Math.min(100, width))

  return (
    <div className="relative flex h-6 w-[75vh] max-w-[75vw] flex-col justify-center overflow-hidden rounded-sm bg-engine-3/30">
      <p className="z-10 ml-2 whitespace-nowrap text-xs">{label}</p>
      <div
        className="absolute bottom-0 left-0 z-0 h-full w-full transform rounded-r-sm bg-engine-3 duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
