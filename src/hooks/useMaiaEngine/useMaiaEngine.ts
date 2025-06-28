import Maia from './model'
import { MaiaStatus } from 'src/types'
import { useState, useMemo } from 'react'

export const useMaiaEngine = () => {
  const [status, setStatus] = useState<MaiaStatus>('loading')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const maia = useMemo(() => {
    const model = new Maia({
      model: '/maia2/maia_rapid.onnx',
      type: 'rapid',
      setStatus: setStatus,
      setProgress: setProgress,
      setError: setError,
    })
    return model
  }, [])

  const downloadModel = async () => {
    try {
      setStatus('downloading')
      await maia.downloadModel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download model')
      setStatus('error')
    }
  }

  return {
    maia,
    status,
    progress,
    error,
    downloadModel,
  }
}
