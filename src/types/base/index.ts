import { Player } from '..'
import { GameTree } from './tree'
import { Termination } from '../analysis'

export * from './tree'

export type Check = false | 'white' | 'black'

export interface Move {
  board: string
  lastMove?: [string, string]
  movePlayed?: [string, string]
  check?: false | 'white' | 'black'
  san?: string
  uci?: string
  maia_values?: { [key: string]: number }
}

export interface BaseGame {
  id: string
  moves: Move[]
  tree: GameTree
}

export interface Game extends BaseGame {
  gameType: string
  blackPlayer: Player
  whitePlayer: Player
  termination: Termination
}

export interface DataNode {
  x: number
  y: number
  nx: number
  san?: string
  move: string
}

export type Color = 'white' | 'black'

export type SetIndexFunction = (index: number) => void
