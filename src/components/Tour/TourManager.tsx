import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTour } from 'src/contexts'

interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

export const TourManager: React.FC = () => {
  const { tourState, nextStep, prevStep, endTour, skipTour, getCurrentStep } =
    useTour()
  const [targetPosition, setTargetPosition] =
    React.useState<ElementPosition | null>(null)
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null)

  const currentStep = getCurrentStep()

  // Create portal root on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalRoot(document.body)
    }
  }, [])

  // Calculate target element position
  const calculateTargetPosition = React.useCallback(() => {
    if (!currentStep) return null

    const targetElement = document.getElementById(currentStep.targetId)
    if (!targetElement) return null

    const rect = targetElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
    }
  }, [currentStep])

  // Update target position when step changes
  useEffect(() => {
    if (tourState.isActive && currentStep) {
      const updatePosition = () => {
        const position = calculateTargetPosition()
        setTargetPosition(position)

        // If position is null and we haven't found the target yet, retry after a short delay
        if (!position) {
          const retryCount = 10
          const retryDelay = 200

          const retry = (attempt: number) => {
            if (attempt >= retryCount) {
              return
            }

            setTimeout(() => {
              const retryPosition = calculateTargetPosition()
              if (retryPosition) {
                setTargetPosition(retryPosition)
                // Auto-scroll to ensure target element is visible
                ensureTargetIsVisible()
              } else {
                retry(attempt + 1)
              }
            }, retryDelay)
          }

          retry(0)
        } else {
          // Auto-scroll to ensure target element is visible
          ensureTargetIsVisible()
        }
      }

      const ensureTargetIsVisible = () => {
        const targetElement = document.getElementById(currentStep.targetId)
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const margin = 100 // Give some margin

          // Only scroll if element is significantly off-screen
          const isSignificantlyOffScreen =
            rect.top < margin ||
            rect.bottom > viewportHeight - margin ||
            rect.left < 0 ||
            rect.right > window.innerWidth

          if (isSignificantlyOffScreen) {
            // Use a gentler scroll that doesn't center aggressively
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'nearest',
            })
          }
        }
      }

      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        updatePosition()
      }, 100)

      // Update position on scroll/resize with throttling for better performance
      let throttleTimer: NodeJS.Timeout | null = null
      const handleScroll = () => {
        if (throttleTimer) return
        throttleTimer = setTimeout(() => {
          updatePosition()
          throttleTimer = null
        }, 16) // ~60fps
      }

      const handleResize = () => {
        if (throttleTimer) return
        throttleTimer = setTimeout(() => {
          updatePosition()
          throttleTimer = null
        }, 16) // ~60fps
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleResize, { passive: true })

      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
        if (throttleTimer) {
          clearTimeout(throttleTimer)
        }
      }
    } else {
      // Reset target position when tour is not active
      setTargetPosition(null)
    }
  }, [tourState.isActive, currentStep, calculateTargetPosition])

  // Handle keyboard navigation
  useEffect(() => {
    if (!tourState.isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          if (tourState.currentStep < tourState.steps.length - 1) {
            nextStep()
          } else {
            endTour()
          }
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          if (tourState.currentStep > 0) {
            prevStep()
          }
          break
        case 'Escape':
          e.preventDefault()
          skipTour()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    tourState.isActive,
    tourState.currentStep,
    tourState.steps.length,
    nextStep,
    prevStep,
    endTour,
    skipTour,
  ])

  // Calculate tooltip position with responsive design
  const getTooltipPosition = () => {
    if (!targetPosition || !currentStep) return { top: 0, left: 0, width: 320 }

    const placement = currentStep.placement || 'bottom'
    const offset = currentStep.offset || { x: 0, y: 0 }
    const isMobile = window.innerWidth <= 768
    const gap = isMobile ? 12 : 20

    // Responsive tooltip dimensions
    const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 40) : 320
    const tooltipHeight = isMobile ? 180 : 200 // Slightly smaller on mobile
    const padding = isMobile ? 12 : 20

    let top = 0
    let left = 0

    // Only modify placement on very small screens (mobile)
    const effectivePlacement =
      isMobile && window.innerWidth <= 480 && placement === 'left'
        ? 'bottom'
        : placement

    switch (effectivePlacement) {
      case 'top':
        top = targetPosition.top - tooltipHeight - gap
        left = targetPosition.left + targetPosition.width / 2 - tooltipWidth / 2
        break
      case 'bottom':
        top = targetPosition.top + targetPosition.height + gap
        left = targetPosition.left + targetPosition.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = targetPosition.top + targetPosition.height / 2 - tooltipHeight / 2
        left = targetPosition.left - tooltipWidth - gap
        break
      case 'right':
        top = targetPosition.top + targetPosition.height / 2 - tooltipHeight / 2
        left = targetPosition.left + targetPosition.width + gap
        break
    }

    // Ensure tooltip stays within viewport - be more conservative on desktop
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Adjust if tooltip goes off-screen
    if (top < padding) {
      top = padding
    } else if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding
    }

    if (left < padding) {
      left = padding
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding
    }

    return {
      top: top + offset.y,
      left: left + offset.x,
      width: tooltipWidth,
    }
  }

  const handleNext = () => {
    if (tourState.currentStep < tourState.steps.length - 1) {
      nextStep()
    } else {
      endTour()
    }
  }

  const handlePrev = () => {
    if (tourState.currentStep > 0) {
      prevStep()
    }
  }

  const tooltipPosition = getTooltipPosition()

  // Only render if tour is active and we have everything we need
  if (!tourState.isActive || !currentStep || !targetPosition || !portalRoot) {
    return null
  }

  return createPortal(
    <div className="theme-dark">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998]"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            WebkitClipPath: `polygon(0% 0%, 0% 100%, ${targetPosition.left - 4}px 100%, ${targetPosition.left - 4}px ${targetPosition.top - 4}px, ${targetPosition.left + targetPosition.width + 4}px ${targetPosition.top - 4}px, ${targetPosition.left + targetPosition.width + 4}px ${targetPosition.top + targetPosition.height + 4}px, ${targetPosition.left - 4}px ${targetPosition.top + targetPosition.height + 4}px, ${targetPosition.left - 4}px 100%, 100% 100%, 100% 0%)`,
            clipPath: `polygon(0% 0%, 0% 100%, ${targetPosition.left - 4}px 100%, ${targetPosition.left - 4}px ${targetPosition.top - 4}px, ${targetPosition.left + targetPosition.width + 4}px ${targetPosition.top - 4}px, ${targetPosition.left + targetPosition.width + 4}px ${targetPosition.top + targetPosition.height + 4}px, ${targetPosition.left - 4}px ${targetPosition.top + targetPosition.height + 4}px, ${targetPosition.left - 4}px 100%, 100% 100%, 100% 0%)`,
          }}
          onClick={skipTour}
        />

        {/* Highlight border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute z-[9999] rounded-lg border-2 border-human-4 bg-transparent"
          style={{
            top: targetPosition.top - 4,
            left: targetPosition.left - 4,
            width: targetPosition.width + 8,
            height: targetPosition.height + 8,
          }}
        />

        {/* Tour tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute z-[10000] rounded-lg bg-background-1 shadow-xl"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: tooltipPosition.width,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-human-4 sm:h-8 sm:w-8">
                <span className="text-xs font-bold text-white sm:text-sm">
                  {tourState.currentStep + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-primary sm:text-lg">
                {currentStep.title}
              </h3>
            </div>
            <button
              onClick={skipTour}
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
              {currentStep.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 p-3 sm:p-4">
            <div className="flex items-center gap-1">
              {tourState.steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                    index === tourState.currentStep
                      ? 'bg-human-4'
                      : index < tourState.currentStep
                        ? 'bg-human-4/60'
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handlePrev}
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
                {tourState.currentStep === tourState.steps.length - 1
                  ? 'Finish'
                  : 'Next'}
                {tourState.currentStep < tourState.steps.length - 1 && (
                  <span className="material-symbols-outlined text-xs sm:text-sm">
                    arrow_forward
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="border-t border-white/10 px-3 py-2 sm:px-4">
            <p className="text-xs text-secondary">
              <span className="hidden sm:inline">
                Use arrow keys to navigate • Press Escape to skip
              </span>
              <span className="sm:hidden">Tap to navigate • Tap X to skip</span>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    portalRoot,
  )
}
