import { useWindowSize } from 'src/hooks'
import { GameNode, GameTree } from 'src/types'
import { FlipIcon } from 'src/components/Icons/icons'
import { useCallback, useEffect, useMemo } from 'react'

interface Props {
  orientation: 'white' | 'black'
  setOrientation: (orientation: 'white' | 'black') => void
  currentNode: GameNode
  plyCount: number
  goToNode: (node: GameNode) => void
  goToNextNode: () => void
  goToPreviousNode: () => void
  goToRootNode: () => void
  gameTree: GameTree
  setCurrentMove?: (move: [string, string] | null) => void
  disableFlip?: boolean
  disablePrevious?: boolean
}

export const BoardController: React.FC<Props> = ({
  orientation,
  setOrientation,
  currentNode,
  plyCount,
  goToNode,
  goToNextNode,
  goToPreviousNode,
  goToRootNode,
  gameTree,
  setCurrentMove,
  disableFlip = false,
  disablePrevious = false,
}: Props) => {
  const { width } = useWindowSize()

  const toggleBoardOrientation = useCallback(() => {
    setOrientation(orientation === 'white' ? 'black' : 'white')
  }, [orientation, setOrientation])

  const hasPrevious = useMemo(() => {
    if (currentNode !== undefined) {
      return !!currentNode?.parent
    }
    return false
  }, [currentNode])

  const hasNext = useMemo(() => {
    if (currentNode !== undefined) {
      return !!currentNode?.mainChild
    }
    return false
  }, [currentNode])

  const getFirst = useCallback(() => {
    goToRootNode()
    setCurrentMove?.(null)
  }, [goToRootNode, setCurrentMove])

  const getPrevious = useCallback(() => {
    goToPreviousNode()
    setCurrentMove?.(null)
  }, [goToPreviousNode, setCurrentMove])

  const getNext = useCallback(() => {
    goToNextNode()
    setCurrentMove?.(null)
  }, [goToNextNode, setCurrentMove])

  const getLast = useCallback(() => {
    let lastNode = currentNode
    while (lastNode?.mainChild) {
      lastNode = lastNode.mainChild
    }
    if (lastNode) {
      goToNode(lastNode)
    }

    setCurrentMove?.(null)
  }, [currentNode, goToNode, setCurrentMove])

  useEffect(() => {
    if (width <= 670) return

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Left':
        case 'ArrowLeft':
          if (hasPrevious && !disablePrevious) getPrevious()
          break
        case 'Right':
        case 'ArrowRight':
          if (hasNext) getNext()
          break
        case 'Down':
        case 'ArrowDown':
          if (hasNext) getLast()
          break
        case 'Up':
        case 'ArrowUp':
          if (hasPrevious && !disablePrevious) getFirst()
          break
        case 'f':
          if (!disableFlip) toggleBoardOrientation()
          break
        default:
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    width,
    hasPrevious,
    hasNext,
    getPrevious,
    getNext,
    getFirst,
    getLast,
    toggleBoardOrientation,
    disablePrevious,
  ])

  return (
    <div className="flex w-full flex-row items-center gap-[1px] md:rounded">
      <button
        onClick={disableFlip ? undefined : toggleBoardOrientation}
        disabled={disableFlip}
        className="flex h-7 flex-1 items-center justify-center bg-button-secondary transition duration-200 hover:bg-human-3 disabled:bg-button-secondary/40 md:rounded-sm"
      >
        {FlipIcon}
      </button>
      <button
        onClick={getFirst}
        disabled={!hasPrevious || disablePrevious}
        className="flex h-7 flex-1 items-center justify-center bg-button-secondary transition duration-200 hover:bg-human-3 disabled:bg-button-secondary/40 md:rounded-sm"
      >
        &#8249;&#8249;&#8249;
      </button>
      <button
        onClick={getPrevious}
        disabled={!hasPrevious || disablePrevious}
        className="flex h-7 flex-1 items-center justify-center bg-button-secondary transition duration-200 hover:bg-human-3 disabled:bg-button-secondary/40 md:rounded-sm"
      >
        &#8249;
      </button>
      <button
        onClick={getNext}
        disabled={!hasNext}
        className="flex h-7 flex-1 items-center justify-center bg-button-secondary transition duration-200 hover:bg-human-3 disabled:bg-button-secondary/40 md:rounded-sm"
      >
        &#8250;
      </button>
      <button
        onClick={getLast}
        disabled={!hasNext}
        className="flex h-7 flex-1 items-center justify-center bg-button-secondary transition duration-200 hover:bg-human-3 disabled:bg-button-secondary/40 md:rounded-sm"
      >
        &#8250;&#8250;&#8250;
      </button>
    </div>
  )
}
