import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import Joyride, { STATUS } from 'react-joyride'
import type { Step } from 'react-joyride'

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
  ready: boolean
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

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloadModalVisible, setIsDownloadModalVisible] = useState(false)
  const [modalJustHidden, setModalJustHidden] = useState(false)
  const [tourState, setTourState] = useState<TourState>({
    isActive: false,
    currentStep: 0,
    steps: [],
    completedTours: [],
    currentTourId: undefined,
    ready: false,
  })

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load completed tours from localStorage after hydration
  useEffect(() => {
    if (isClient) {
      const completedTours = JSON.parse(
        localStorage.getItem('maia-completed-tours') || '[]',
      )

      setTourState((prev) => ({
        ...prev,
        completedTours,
        ready: true,
      }))
    }
  }, [isClient])

  // Monitor download modal visibility
  useEffect(() => {
    if (!isClient) return

    const checkModal = () => {
      const modal = document.querySelector('[data-testid="download-modal"]')
      const modalVisible = !!modal

      if (isDownloadModalVisible && !modalVisible) {
        // Modal just became hidden, add a short delay
        setModalJustHidden(true)
        setTimeout(() => {
          setModalJustHidden(false)
        }, 500)
      }

      setIsDownloadModalVisible(modalVisible)
    }

    // Check immediately
    checkModal()

    // Set up an observer to watch for DOM changes
    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [isClient])

  const [joyrideSteps, setJoyrideSteps] = useState<Step[]>([])

  // Custom Tooltip Component with handlers passed via props
  const CustomTooltip = ({
    step,
    tooltipProps,
    primaryProps,
    backProps,
    closeProps,
    isLastStep,
    index,
    size,
  }: {
    step: { content: unknown }
    tooltipProps: React.HTMLAttributes<HTMLDivElement>
    primaryProps: React.ButtonHTMLAttributes<HTMLButtonElement>
    backProps: React.ButtonHTMLAttributes<HTMLButtonElement>
    closeProps: React.ButtonHTMLAttributes<HTMLButtonElement>
    isLastStep: boolean
    index: number
    size: number
  }) => {
    // step.content contains our TourStep object with title and description
    const tourStep = step.content as TourStep

    return (
      <div
        {...tooltipProps}
        className="rounded-lg border border-white/10 bg-background-1 shadow-xl"
        style={{
          width: '320px',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-human-4 sm:h-8 sm:w-8">
              <span className="text-xs font-bold text-white sm:text-sm">
                {index + 1}
              </span>
            </div>
            <h3 className="text-base font-semibold text-primary sm:text-lg">
              {tourStep.title}
            </h3>
          </div>
          <button
            onClick={() => skipTour()}
            className="text-secondary hover:text-primary"
            title="Skip tour"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <p className="text-xs leading-relaxed text-secondary sm:text-sm">
            {tourStep.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 p-3 sm:p-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: size }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                  idx === index
                    ? 'bg-human-4'
                    : idx < index
                      ? 'bg-human-4/60'
                      : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handlePrevious}
              disabled={tourState.currentStep === 0}
              className="flex items-center gap-1 rounded bg-background-2 px-2 py-1 text-xs text-secondary transition-colors hover:bg-background-3 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
            >
              <span className="material-symbols-outlined text-xs sm:text-sm">
                arrow_back
              </span>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 rounded bg-human-4 px-2 py-1 text-xs text-white transition-colors hover:bg-human-4/80 sm:px-3 sm:text-sm"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && (
                <span className="material-symbols-outlined text-xs sm:text-sm">
                  arrow_forward
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Convert TourStep[] to Joyride Step[]
  const convertToJoyrideSteps = useCallback((steps: TourStep[]): Step[] => {
    return steps.map((step) => ({
      target: `#${step.targetId}`,
      content: step as unknown as React.ReactNode, // Custom tooltip component handles this
      placement: step.placement || 'bottom',
      disableBeacon: true,
      hideCloseButton: true,
      showSkipButton: false,
      offset: step.offset?.x || step.offset?.y ? step.offset.x || 0 : 10,
    }))
  }, [])

  // Helper function to actually start the tour
  const doStartTour = useCallback(
    (tourId: string, steps: TourStep[]) => {
      setTourState((prevState) => {
        const stateCompletedTours = prevState.completedTours
        const localStorageCompletedTours = isClient
          ? JSON.parse(localStorage.getItem('maia-completed-tours') || '[]')
          : []

        const allCompletedTours = [
          ...new Set([...stateCompletedTours, ...localStorageCompletedTours]),
        ]

        return {
          isActive: true,
          currentStep: 0,
          steps,
          completedTours: allCompletedTours,
          currentTourId: tourId,
          ready: prevState.ready,
        }
      })
    },
    [isClient],
  )

  const startTour = useCallback(
    (tourId: string, steps: TourStep[], forceRestart = false) => {
      // For force restart (manual starts), only check if client is ready
      // For automatic starts, check if tours are ready
      if (!isClient || (!forceRestart && !tourState.ready)) {
        return
      }

      // Check if tour is already completed (for non-forced starts)
      if (!forceRestart) {
        const stateCompletedTours = tourState.completedTours
        const localStorageCompletedTours = isClient
          ? JSON.parse(localStorage.getItem('maia-completed-tours') || '[]')
          : []
        const allCompletedTours = [
          ...new Set([...stateCompletedTours, ...localStorageCompletedTours]),
        ]

        if (allCompletedTours.includes(tourId)) {
          return
        }

        // Check if tour is already active
        if (tourState.isActive && tourState.currentTourId === tourId) {
          return
        }
      }

      // For automatic starts, check if target elements exist
      if (!forceRestart && steps.length > 0) {
        const firstTargetId = steps[0].targetId
        const targetElement = document.getElementById(firstTargetId)
        if (!targetElement) {
          // Retry with multiple attempts to handle loading states
          let attempts = 0
          const maxAttempts = 5
          const retryInterval = setInterval(() => {
            attempts++
            const retryElement = document.getElementById(firstTargetId)
            if (retryElement) {
              clearInterval(retryInterval)
              doStartTour(tourId, steps)
            } else if (attempts >= maxAttempts) {
              clearInterval(retryInterval)
            }
          }, 1000)
          return
        }
      }

      // Start the tour immediately
      doStartTour(tourId, steps)
    },
    [
      isClient,
      tourState.ready,
      tourState.completedTours,
      tourState.isActive,
      tourState.currentTourId,
      doStartTour,
    ],
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
      const currentTourId = prev.currentTourId || 'analysis'

      const completedTours = prev.completedTours.includes(currentTourId)
        ? prev.completedTours
        : [...prev.completedTours, currentTourId]

      if (isClient) {
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
  }, [isClient])

  const skipTour = useCallback(() => {
    setTourState((prev) => {
      const currentTourId = prev.currentTourId || 'analysis'

      const completedTours = prev.completedTours.includes(currentTourId)
        ? prev.completedTours
        : [...prev.completedTours, currentTourId]

      if (isClient) {
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
  }, [isClient])

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

  // Helper function for mobile scrolling
  const scrollToTooltipOnMobile = useCallback(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setTimeout(() => {
        const tooltip = document.querySelector(
          '[data-testid="react-joyride-tooltip"], .react-joyride__tooltip',
        )
        if (tooltip) {
          const rect = tooltip.getBoundingClientRect()
          const scrollTop = window.pageYOffset + rect.top - 20

          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          })
        }
      }, 100)
    }
  }, [])

  // Custom handlers for navigation
  const handleNext = useCallback(() => {
    if (tourState.currentStep < tourState.steps.length - 1) {
      nextStep()
      scrollToTooltipOnMobile()
    } else {
      endTour()
    }
  }, [
    tourState.currentStep,
    tourState.steps.length,
    nextStep,
    endTour,
    scrollToTooltipOnMobile,
  ])

  const handlePrevious = useCallback(() => {
    if (tourState.currentStep > 0) {
      prevStep()
      scrollToTooltipOnMobile()
    }
  }, [tourState.currentStep, prevStep, scrollToTooltipOnMobile])

  const handleClose = useCallback(() => {
    skipTour()
  }, [skipTour])

  // Update Joyride steps when tour state changes
  useEffect(() => {
    if (tourState.isActive && tourState.steps.length > 0) {
      const steps = convertToJoyrideSteps(tourState.steps)
      setJoyrideSteps(steps)
    } else {
      setJoyrideSteps([])
    }
  }, [tourState.isActive, tourState.steps, convertToJoyrideSteps])

  // Disable keyboard navigation for tours
  useEffect(() => {
    if (!tourState.isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent arrow keys and escape from affecting tour
      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'Escape'
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [tourState.isActive])

  // Handle Joyride callback
  const handleJoyrideCallback = useCallback(
    (data: {
      status: string
      type: string
      action?: string
      index?: number
    }) => {
      const { status, type, action, index } = data

      // Handle mobile scrolling when a step becomes active
      if (
        type === 'step:after' &&
        (action === 'next' || action === 'prev' || action === 'start')
      ) {
        scrollToTooltipOnMobile()
      }

      // Also handle initial tour start
      if (type === 'tour:start') {
        scrollToTooltipOnMobile()
      }

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        endTour()
      }
    },
    [endTour, scrollToTooltipOnMobile],
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

  const shouldShowJoyride = useMemo(() => {
    if (!isClient || !tourState.isActive) return false
    // Don't show joyride if download modal is visible or just hidden
    return !isDownloadModalVisible && !modalJustHidden
  }, [isClient, tourState.isActive, isDownloadModalVisible, modalJustHidden])

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {shouldShowJoyride && (
        <Joyride
          run={tourState.isActive}
          steps={joyrideSteps}
          stepIndex={tourState.currentStep}
          callback={handleJoyrideCallback}
          continuous={false}
          showProgress={false}
          showSkipButton={false}
          disableCloseOnEsc={true}
          disableScrollParentFix={true}
          scrollToFirstStep
          scrollOffset={100}
          disableScrolling={false}
          disableOverlayClose={true}
          hideBackButton={true}
          hideCloseButton={true}
          tooltipComponent={CustomTooltip}
          styles={{
            options: {
              arrowColor: 'rgb(38, 36, 45)', // background-1 to match tooltip
              backgroundColor: 'rgb(38, 36, 45)', // background-1 to match tooltip
              overlayColor: 'rgba(0, 0, 0, 0.5)',
              spotlightShadow: '0 0 15px rgba(159, 79, 68, 0.3)',
              zIndex: 10000,
            },
            spotlight: {
              borderRadius: '4px',
            },
            tooltip: {
              backgroundColor: 'rgb(38, 36, 45)', // background-1 to match our custom component
              color: 'rgb(235, 235, 235)', // primary text
            },
          }}
          locale={{
            back: 'Previous',
            close: 'Close',
            last: 'Finish',
            next: 'Next',
            skip: 'Skip',
          }}
          floaterProps={{
            disableAnimation: false,
            styles: {
              floater: {
                filter: 'none',
              },
              arrow: {
                spread: 8,
                length: 8,
                color: 'rgb(38, 36, 45)', // background-1 to match tooltip
              },
            },
          }}
        />
      )}
    </TourContext.Provider>
  )
}
