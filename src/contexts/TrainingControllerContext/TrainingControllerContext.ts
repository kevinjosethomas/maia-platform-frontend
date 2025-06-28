import { Chess } from 'chess.ts'
import { createContext } from 'react'
import { GameTree, GameNode } from 'src/types'
import { BaseTreeControllerContext } from '../BaseTreeControllerContext'

export interface ITrainingControllerContext extends BaseTreeControllerContext {
  currentNode: GameNode
  moves?: Map<string, string[]>
}

const defaultContext: ITrainingControllerContext = {
  gameTree: new GameTree(new Chess().fen()),
  currentNode: new GameTree(new Chess().fen()).getRoot(),
  goToNode: () => {
    /* no-op */
  },
  goToNextNode: () => {
    /* no-op */
  },
  goToPreviousNode: () => {
    /* no-op */
  },
  goToRootNode: () => {
    /* no-op */
  },
  plyCount: 0,
  orientation: 'white',
  setOrientation: () => {
    /* no-op */
  },
  moves: undefined,
}

export const TrainingControllerContext =
  createContext<ITrainingControllerContext>(defaultContext)
