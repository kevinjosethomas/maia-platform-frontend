import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react'

export interface TourStep {
  id: string
  title: string
  description: string
  targetId: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  offset?: { x: number; y: number }
}

export interface TourState {
  isActive: boolean
  currentStep: number
  steps: TourStep[]
  completedTours: string[]
  currentTourId?: string
}

export interface TourContextType {
  tourState: TourState
  startTour: (tourId: string, steps: TourStep[], forceRestart?: boolean) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
  skipTour: () => void
  isStepActive: (stepId: string) => boolean
  getCurrentStep: () => TourStep | null
  hasCompletedTour: (tourId: string) => boolean
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export const useTour = () => {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

interface TourProviderProps {
  children: React.ReactNode
}

export const TourProvider: React.FC<TourProviderProps> = memo(
  ({ children }) => {
    const [tourState, setTourState] = useState<TourState>(() => {
      // Initialize completedTours from localStorage only once
      const completedTours =
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('maia-completed-tours') || '[]')
          : []

      return {
        isActive: false,
        currentStep: 0,
        steps: [],
        completedTours,
        currentTourId: undefined,
      }
    })

    // Prevent unnecessary re-renders by adding a ref to track if we're already starting a tour
    const isStartingTour = React.useRef(false)

    const startTour = useCallback(
      (tourId: string, steps: TourStep[], forceRestart = false) => {
        if (typeof window === 'undefined') return

        // Prevent concurrent tour starts
        if (isStartingTour.current && !forceRestart) {
          return
        }

        setTourState((prevState) => {
          // Use state first, then localStorage as fallback
          const stateCompletedTours = prevState.completedTours
          const localStorageCompletedTours =
            typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem('maia-completed-tours') || '[]')
              : []

          // Merge state and localStorage, removing duplicates
          const allCompletedTours = [
            ...new Set([...stateCompletedTours, ...localStorageCompletedTours]),
          ]

          // If not forcing restart and tour is completed, don't start
          if (!forceRestart && allCompletedTours.includes(tourId)) {
            return prevState
          }

          // If tour is already active and we're not forcing restart, don't restart
          if (prevState.isActive && !forceRestart) {
            return prevState
          }

          // Don't start tour if it's already this tour and active
          if (
            prevState.isActive &&
            prevState.currentTourId === tourId &&
            !forceRestart
          ) {
            return prevState
          }
          isStartingTour.current = true
          // Reset the flag after a brief delay to allow the state to update
          setTimeout(() => {
            isStartingTour.current = false
          }, 100)

          return {
            isActive: true,
            currentStep: 0,
            steps,
            completedTours: allCompletedTours, // Use merged completed tours
            currentTourId: tourId,
          }
        })
      },
      [],
    )

    const nextStep = useCallback(() => {
      setTourState((prev) => {
        if (prev.currentStep < prev.steps.length - 1) {
          return {
            ...prev,
            currentStep: prev.currentStep + 1,
          }
        }
        return prev
      })
    }, [])

    const prevStep = useCallback(() => {
      setTourState((prev) => {
        if (prev.currentStep > 0) {
          return {
            ...prev,
            currentStep: prev.currentStep - 1,
          }
        }
        return prev
      })
    }, [])

    const endTour = useCallback(() => {
      setTourState((prev) => {
        // Mark tour as completed - use the properly tracked tour ID
        const currentTourId = prev.currentTourId || 'analysis' // fallback for safety

        // Only add to completedTours if not already present
        const completedTours = prev.completedTours.includes(currentTourId)
          ? prev.completedTours
          : [...prev.completedTours, currentTourId]

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'maia-completed-tours',
            JSON.stringify(completedTours),
          )
        }

        return {
          ...prev,
          isActive: false,
          currentStep: 0,
          steps: [],
          completedTours,
          currentTourId: undefined,
        }
      })
    }, [])

    const skipTour = useCallback(() => {
      setTourState((prev) => {
        // Mark tour as completed when skipped - use the properly tracked tour ID
        const currentTourId = prev.currentTourId || 'analysis' // fallback for safety

        // Only add to completedTours if not already present
        const completedTours = prev.completedTours.includes(currentTourId)
          ? prev.completedTours
          : [...prev.completedTours, currentTourId]

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'maia-completed-tours',
            JSON.stringify(completedTours),
          )
        }

        return {
          ...prev,
          isActive: false,
          currentStep: 0,
          steps: [],
          completedTours,
          currentTourId: undefined,
        }
      })
    }, [])

    const isStepActive = useCallback(
      (stepId: string) => {
        return (
          tourState.isActive &&
          tourState.steps[tourState.currentStep]?.id === stepId
        )
      },
      [tourState.isActive, tourState.currentStep, tourState.steps],
    )

    const getCurrentStep = useCallback(() => {
      if (
        !tourState.isActive ||
        tourState.currentStep >= tourState.steps.length
      ) {
        return null
      }
      return tourState.steps[tourState.currentStep]
    }, [tourState.isActive, tourState.currentStep, tourState.steps])

    const hasCompletedTour = useCallback(
      (tourId: string) => {
        return tourState.completedTours.includes(tourId)
      },
      [tourState.completedTours],
    )

    const contextValue: TourContextType = useMemo(
      () => ({
        tourState,
        startTour,
        nextStep,
        prevStep,
        endTour,
        skipTour,
        isStepActive,
        getCurrentStep,
        hasCompletedTour,
      }),
      [
        tourState,
        startTour,
        nextStep,
        prevStep,
        endTour,
        skipTour,
        isStepActive,
        getCurrentStep,
        hasCompletedTour,
      ],
    )

    return (
      <TourContext.Provider value={contextValue}>
        {children}
      </TourContext.Provider>
    )
  },
)

TourProvider.displayName = 'TourProvider'
