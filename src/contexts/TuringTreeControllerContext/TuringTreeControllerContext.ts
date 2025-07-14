import { Chess } from 'chess.ts'
import { createContext } from 'react'
import { GameTree, Color, GameNode } from 'src/types'
import { TuringGame } from 'src/types/turing'
import { AllStats } from 'src/hooks/useStats'
import { BaseTreeControllerContext } from '../BaseTreeControllerContext'

export interface ITuringControllerContext extends BaseTreeControllerContext {
  game?: TuringGame
  games: { [id: string]: TuringGame }
  loading: boolean
  gameIds: string[]
  stats: AllStats

  getNewGame: () => Promise<void>
  currentGameId: string
  setCurrentGameId: (id: string) => void
  submitGuess: (
    guess: Color,
    comment?: string,
    rating?: number,
  ) => Promise<void>
  commentController: [string, (comment: string) => void]
}

const defaultContext: ITuringControllerContext = {
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
  currentGameId: '',
  setCurrentGameId: () => {
    /* no-op */
  },
  plyCount: 0,
  orientation: 'white',
  setOrientation: () => {
    /* no-op */
  },
  game: undefined,
  games: {},
  loading: false,
  gameIds: [],
  stats: {
    lifetime: undefined,
    session: { gamesWon: 0, gamesPlayed: 0 },
    lastRating: undefined,
    rating: 0,
  },
  getNewGame: async () => {
    /* no-op */
  },
  submitGuess: async () => {
    /* no-op */
  },
  commentController: [
    '',
    () => {
      /* no-op */
    },
  ],
}

export const TuringControllerContext =
  createContext<ITuringControllerContext>(defaultContext)
