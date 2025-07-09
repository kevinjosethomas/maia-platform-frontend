import { ReactNode } from 'react'

import { TourProvider as TourContextProvider } from 'src/contexts'
import { TourOverlay } from 'src/components/Tour'

export const TourProvider: React.FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return (
    <TourContextProvider>
      <TourOverlay>{children}</TourOverlay>
    </TourContextProvider>
  )
}
