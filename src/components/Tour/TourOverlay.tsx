import React, { memo } from 'react'

interface TourOverlayProps {
  children: React.ReactNode
}

// Memoize the children to prevent unnecessary re-renders
const MemoizedChildren = memo(({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
})

MemoizedChildren.displayName = 'MemoizedChildren'

export const TourOverlay: React.FC<TourOverlayProps> = ({ children }) => {
  // Just render the children - tour UI is handled by TourManager
  return <MemoizedChildren>{children}</MemoizedChildren>
}
