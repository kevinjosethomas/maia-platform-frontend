import { useContext } from 'react'
import { BaseTreeControllerContext } from 'src/contexts/BaseTreeControllerContext'
import { TreeControllerContext } from 'src/contexts/TreeControllerContext/TreeControllerContext'
import { PlayControllerContext } from 'src/contexts/PlayControllerContext/PlayControllerContext'
import { TuringControllerContext } from 'src/contexts/TuringTreeControllerContext/TuringTreeControllerContext'
import { TrainingControllerContext } from 'src/contexts/TrainingControllerContext/TrainingControllerContext'

type ContextType = 'analysis' | 'play' | 'turing' | 'training'

export function useBaseTreeController(
  type: ContextType,
): BaseTreeControllerContext {
  const analysisContext = useContext(TreeControllerContext)
  const playContext = useContext(PlayControllerContext)
  const turingContext = useContext(TuringControllerContext)
  const trainingContext = useContext(TrainingControllerContext)

  switch (type) {
    case 'analysis':
      return analysisContext
    case 'play':
      return playContext
    case 'turing':
      return turingContext
    case 'training':
      return trainingContext
    default:
      throw new Error(`Unknown context type: ${type}`)
  }
}
