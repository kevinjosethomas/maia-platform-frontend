import { Game, Move, MoveMap, GameTree } from '..'

export interface AvailableMoves {
  [fromTo: string]: Move
}

export interface TrainingGame extends Game {
  puzzle_elo: number
  stockfishEvaluation: MoveMap
  maiaEvaluation: MoveMap
  availableMoves: AvailableMoves
  targetIndex: number
  result?: boolean
  tree: GameTree
}

export type Status =
  | 'default'
  | 'loading'
  | 'forfeit'
  | 'correct'
  | 'incorrect'
  | 'archived'
