import { useCallback, useEffect, useRef } from 'react'

export const useChessSound = () => {
  const moveAudioRef = useRef<HTMLAudioElement | null>(null)
  const captureAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    moveAudioRef.current = new Audio('/assets/sound/move.mp3')
    captureAudioRef.current = new Audio('/assets/sound/capture.mp3')
  }, [])

  const playSound = useCallback((isCapture: boolean) => {
    if (isCapture && captureAudioRef.current) {
      captureAudioRef.current.currentTime = 0
      captureAudioRef.current
        .play()
        .catch((err) => console.error('Error playing capture sound:', err))
    } else if (moveAudioRef.current) {
      moveAudioRef.current.currentTime = 0
      moveAudioRef.current
        .play()
        .catch((err) => console.error('Error playing move sound:', err))
    }
  }, [])

  return { playSound }
}
