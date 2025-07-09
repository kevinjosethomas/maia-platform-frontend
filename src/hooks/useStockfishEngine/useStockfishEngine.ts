import Engine from './engine'
import { useMemo, useRef, useCallback } from 'react'

export const useStockfishEngine = () => {
  const engineRef = useRef<Engine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new Engine()
  }

  const streamEvaluations = useCallback(
    (fen: string, legalMoveCount: number) => {
      if (!engineRef.current) {
        console.error('Engine not initialized')
        return null
      }
      return engineRef.current.streamEvaluations(fen, legalMoveCount)
    },
    [],
  )

  const stopEvaluation = useCallback(() => {
    engineRef.current?.stopEvaluation()
  }, [])

  const isReady = useCallback(() => {
    return engineRef.current?.ready ?? false
  }, [])

  return useMemo(
    () => ({
      streamEvaluations,
      stopEvaluation,
      isReady,
    }),
    [streamEvaluations, stopEvaluation, isReady],
  )
}
