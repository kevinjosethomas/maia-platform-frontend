import { Opening, OpeningVariation } from 'src/types'

interface Props {
  selectedOpening: Opening
  selectedVariation: OpeningVariation | null
}

export const OpeningDetails: React.FC<Props> = ({
  selectedOpening,
  selectedVariation,
}: Props) => {
  return (
    <div className="flex flex-col gap-4 overflow-hidden border border-white border-opacity-5 bg-background-1 pt-4 md:rounded">
      <div className="flex flex-col gap-2 px-4">
        <h2 className="text-2xl font-bold">{selectedOpening.name}</h2>
        <p className="text-sm text-primary/60">{selectedOpening.description}</p>
      </div>
      <div className="flex w-full items-center justify-center bg-background-2/80 py-1.5">
        <p className="text-sm font-medium uppercase text-primary/80">
          {selectedVariation ? selectedVariation.name : 'No Variation'}
        </p>
      </div>
    </div>
  )
}
