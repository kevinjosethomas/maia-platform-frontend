import React, { createContext, useContext, useState, ReactNode } from 'react'

interface LeaderboardContextType {
  activePopup: string | null
  setActivePopup: (entryKey: string | null) => void
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(
  undefined,
)

export const useLeaderboardContext = () => {
  const context = useContext(LeaderboardContext)
  if (!context) {
    throw new Error(
      'useLeaderboardContext must be used within a LeaderboardProvider',
    )
  }
  return context
}

interface LeaderboardProviderProps {
  children: ReactNode
}

export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({
  children,
}) => {
  const [activePopup, setActivePopup] = useState<string | null>(null)

  return (
    <LeaderboardContext.Provider value={{ activePopup, setActivePopup }}>
      {children}
    </LeaderboardContext.Provider>
  )
}
