import { AnalyzedGame, AnalysisWebGame } from 'src/types'

export interface StoredCustomAnalysis {
  id: string
  name: string
  type: 'custom-pgn' | 'custom-fen'
  data: string // PGN or FEN data
  createdAt: string
  preview?: string // Short preview for display
}

const STORAGE_KEY = 'maia_custom_analyses'

export const saveCustomAnalysis = (
  type: 'pgn' | 'fen',
  data: string,
  name?: string,
): StoredCustomAnalysis => {
  const analyses = getStoredCustomAnalyses()
  const id = `custom-${type}-${Date.now()}`

  let preview = ''
  if (type === 'pgn') {
    const whiteMatch = data.match(/\[White\s+"([^"]+)"\]/)
    const blackMatch = data.match(/\[Black\s+"([^"]+)"\]/)
    if (whiteMatch && blackMatch) {
      preview = `${whiteMatch[1]} vs ${blackMatch[1]}`
    } else {
      preview = 'PGN Game'
    }
  } else {
    preview = 'FEN Position'
  }

  const analysis: StoredCustomAnalysis = {
    id,
    name: name || preview,
    type: `custom-${type}` as 'custom-pgn' | 'custom-fen',
    data,
    createdAt: new Date().toISOString(),
    preview,
  }

  analyses.unshift(analysis)

  const trimmedAnalyses = analyses.slice(0, 50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedAnalyses))

  return analysis
}

export const getStoredCustomAnalyses = (): StoredCustomAnalysis[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to parse stored custom analyses:', error)
    return []
  }
}

export const deleteCustomAnalysis = (id: string): void => {
  const analyses = getStoredCustomAnalyses()
  const filtered = analyses.filter((analysis) => analysis.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export const getCustomAnalysisById = (
  id: string,
): StoredCustomAnalysis | undefined => {
  const analyses = getStoredCustomAnalyses()
  return analyses.find((analysis) => analysis.id === id)
}

export const convertStoredAnalysisToWebGame = (
  analysis: StoredCustomAnalysis,
): AnalysisWebGame => {
  return {
    id: analysis.id,
    type: analysis.type,
    label: analysis.name,
    result: '*', // Custom analyses don't have results
    pgn: analysis.type === 'custom-pgn' ? analysis.data : undefined,
  }
}

export const getCustomAnalysesAsWebGames = (): AnalysisWebGame[] => {
  const stored = getStoredCustomAnalyses()
  return stored.map(convertStoredAnalysisToWebGame)
}
