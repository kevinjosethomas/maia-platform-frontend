import React, { SetStateAction } from 'react'
import { Chess } from 'chess.ts'
import { useTreeController } from 'src/hooks/useTreeController'
import { BaseTreeControllerContext } from '../BaseTreeControllerContext'
import { GameTree } from 'src/types'

export interface ITreeControllerContext extends BaseTreeControllerContext {
  currentNode: ReturnType<typeof useTreeController>['currentNode']
  setCurrentNode: ReturnType<typeof useTreeController>['setCurrentNode']
}

const defaultGameTree = new GameTree(new Chess().fen())

export const TreeControllerContext =
  React.createContext<ITreeControllerContext>({
    gameTree: defaultGameTree,
    currentNode: defaultGameTree.getRoot(),
    setCurrentNode: () => {
      throw new Error('TreeControllerContext not provided')
    },
    orientation: 'white',
    setOrientation: () => {
      throw new Error('TreeControllerContext not provided')
    },
    goToNode: () => {
      throw new Error('TreeControllerContext not provided')
    },
    goToNextNode: () => {
      throw new Error('TreeControllerContext not provided')
    },
    goToPreviousNode: () => {
      throw new Error('TreeControllerContext not provided')
    },
    goToRootNode: () => {
      throw new Error('TreeControllerContext not provided')
    },
    plyCount: 0,
  })
