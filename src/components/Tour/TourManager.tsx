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
          const retryCount = 5
          const retryDelay = 100

          const retry = (attempt: number) => {
            if (attempt >= retryCount) return

            setTimeout(() => {
              const retryPosition = calculateTargetPosition()
              if (retryPosition) {
                setTargetPosition(retryPosition)
              } else {
                retry(attempt + 1)
              }
            }, retryDelay)
          }

          retry(0)
        }
      }

      updatePosition()

      // Update position on scroll/resize
      const handleScroll = () => updatePosition()
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleScroll)

      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleScroll)
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

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetPosition || !currentStep) return { top: 0, left: 0 }

    const placement = currentStep.placement || 'bottom'
    const offset = currentStep.offset || { x: 0, y: 0 }
    const tooltipWidth = 320
    const tooltipHeight = 200 // Approximate height
    const gap = 20

    let top = 0
    let left = 0

    switch (placement) {
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

    // Ensure tooltip stays within viewport
    const padding = 20
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipHeight - padding),
    )
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipWidth - padding),
    )

    return { top: top + offset.y, left: left + offset.x }
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
          className="absolute z-[10000] w-80 rounded-lg bg-background-1 shadow-xl"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-human-4">
                <span className="text-sm font-bold text-white">
                  {tourState.currentStep + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary">
                {currentStep.title}
              </h3>
            </div>
            <button
              onClick={skipTour}
              className="text-secondary hover:text-primary"
              title="Skip tour"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm leading-relaxed text-secondary">
              {currentStep.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 p-4">
            <div className="flex items-center gap-1">
              {tourState.steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === tourState.currentStep
                      ? 'bg-human-4'
                      : index < tourState.currentStep
                        ? 'bg-human-4/60'
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={tourState.currentStep === 0}
                className="flex items-center gap-1 rounded bg-background-2 px-3 py-1 text-sm text-secondary transition-colors hover:bg-background-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 rounded bg-human-4 px-3 py-1 text-sm text-white transition-colors hover:bg-human-4/80"
              >
                {tourState.currentStep === tourState.steps.length - 1
                  ? 'Finish'
                  : 'Next'}
                {tourState.currentStep < tourState.steps.length - 1 && (
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="border-t border-white/10 px-4 py-2">
            <p className="text-xs text-secondary">
              Use arrow keys to navigate • Press Escape to skip
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    portalRoot,
  )
}
