import { Termination, Color, Player, GameTree } from '..'
import { BaseGame } from '../base'

export interface TuringGame extends BaseGame {
  termination: Termination
  result?: TuringSubmissionResult
}

export interface TuringSubmissionResult {
  bot: Color
  blackPlayer: Player
  whitePlayer: Player
  correct: boolean
  gameType: string
  timeControl: string
  turingElo: number
  ratingDiff: number
}
