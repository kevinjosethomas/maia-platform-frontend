/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Player,
  MoveMap,
  GameTree,
  GameNode,
  AnalyzedGame,
  MaiaEvaluation,
  PositionEvaluation,
  StockfishEvaluation,
  AnalysisTournamentGame,
} from 'src/types'
import { buildUrl } from '../utils'
import { cpToWinrate } from 'src/lib/stockfish'
import { AvailableMoves } from 'src/types/training'

function buildGameTree(moves: any[], initialFen: string) {
  const tree = new GameTree(initialFen)
  let currentNode = tree.getRoot()

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]

    if (move.lastMove) {
      const [from, to] = move.lastMove
      currentNode = tree.addMainMove(
        currentNode,
        move.board,
        from + to,
        move.san || '',
      )
    }
  }

  return tree
}

const readStream = (processLine: (data: any) => void) => (response: any) => {
  const stream = response.body.getReader()
  const matcher = /\r?\n/
  const decoder = new TextDecoder()
  let buf = ''

  const loop = () =>
    stream.read().then(({ done, value }: { done: boolean; value: any }) => {
      if (done) {
        if (buf.length > 0) processLine(JSON.parse(buf))
      } else {
        const chunk = decoder.decode(value, {
          stream: true,
        })
        buf += chunk

        const parts = (buf || '').split(matcher)
        buf = parts.pop() as string
        for (const i of parts.filter((p) => p)) processLine(JSON.parse(i))

        return loop()
      }
    })

  return loop()
}

export const getAnalysisList = async (): Promise<
  Map<string, AnalysisTournamentGame[]>
> => {
  const res = await fetch(buildUrl('analysis/list'))

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  const data = await res.json()

  return data
}

export const getAnalysisGameList = async (type = 'play', page = 1) => {
  const res = await fetch(buildUrl(`analysis/user/list/${type}/${page}`))

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  const data = await res.json()

  return data
}

export const getLichessGames = async (
  username: string,
  onMessage: (data: any) => void,
) => {
  const stream = fetch(
    `https://lichess.org/api/games/user/${username}?max=100&pgnInJson=true`,
    {
      headers: {
        Accept: 'application/x-ndjson',
      },
    },
  )
  stream.then(readStream(onMessage))
}

export const getLichessGamePGN = async (id: string) => {
  const res = await fetch(`https://lichess.org/game/export/${id}`, {
    headers: {
      Accept: 'application/x-chess-pgn',
    },
  })
  return res.text()
}

function convertMoveMapToStockfishEval(
  moveMap: MoveMap,
  turn: 'w' | 'b',
): StockfishEvaluation {
  const cp_vec: { [key: string]: number } = {}
  const cp_relative_vec: { [key: string]: number } = {}
  let model_optimal_cp = -Infinity
  let model_move = ''

  for (const move in moveMap) {
    const cp = moveMap[move]
    cp_vec[move] = cp
    if (cp > model_optimal_cp) {
      model_optimal_cp = cp
      model_move = move
    }
  }

  for (const move in cp_vec) {
    const cp = moveMap[move]
    cp_relative_vec[move] = cp - model_optimal_cp
  }

  const cp_vec_sorted = Object.fromEntries(
    Object.entries(cp_vec).sort(([, a], [, b]) => b - a),
  )

  const cp_relative_vec_sorted = Object.fromEntries(
    Object.entries(cp_relative_vec).sort(([, a], [, b]) => b - a),
  )

  const winrate_vec: { [key: string]: number } = {}
  let max_winrate = -Infinity

  for (const move in cp_vec_sorted) {
    const cp = cp_vec_sorted[move]
    const winrate = cpToWinrate(cp, false)
    winrate_vec[move] = winrate

    if (winrate_vec[move] > max_winrate) {
      max_winrate = winrate_vec[move]
    }
  }

  const winrate_loss_vec: { [key: string]: number } = {}
  for (const move in winrate_vec) {
    winrate_loss_vec[move] = winrate_vec[move] - max_winrate
  }

  const winrate_vec_sorted = Object.fromEntries(
    Object.entries(winrate_vec).sort(([, a], [, b]) => b - a),
  )

  const winrate_loss_vec_sorted = Object.fromEntries(
    Object.entries(winrate_loss_vec).sort(([, a], [, b]) => b - a),
  )

  if (turn === 'b') {
    model_optimal_cp *= -1
    for (const move in cp_vec_sorted) {
      cp_vec_sorted[move] *= -1
    }
  }

  return {
    sent: true,
    depth: 20,
    model_move: model_move,
    model_optimal_cp: model_optimal_cp,
    cp_vec: cp_vec_sorted,
    cp_relative_vec: cp_relative_vec_sorted,
    winrate_vec: winrate_vec_sorted,
    winrate_loss_vec: winrate_loss_vec_sorted,
  }
}

export const getAnalyzedTournamentGame = async (gameId = ['FkgYSri1']) => {
  const res = await fetch(
    buildUrl(`analysis/analysis_list/${gameId.join('/')}`),
  )

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  const data = await res.json()
  const id = data['id']
  const termination = {
    ...data['termination'],
    condition: 'Normal',
  }

  const gameType = 'blitz'
  const blackPlayer = data['black_player'] as Player
  const whitePlayer = data['white_player'] as Player

  const maiaEvals: { [model: string]: MoveMap[] } = {}
  const stockfishEvaluations: MoveMap[] = data['stockfish_evals']

  const availableMoves: AvailableMoves[] = []

  for (const model of data['maia_versions']) {
    maiaEvals[model] = data['maia_evals'][model]
  }

  for (const position of data['move_maps']) {
    const moves: AvailableMoves = {}
    for (const move of position) {
      const fromTo = move.move.join('')
      const san = move['move_san']
      const { check, fen } = move

      moves[fromTo] = {
        board: fen,
        check,
        san,
        lastMove: move.move,
      }
    }
    availableMoves.push(moves)
  }

  const gameStates = data['game_states']

  const moves = gameStates.map((gameState: any) => {
    const {
      last_move: lastMove,
      fen,
      check,
      last_move_san: san,
      evaluations: maia_values,
    } = gameState

    return {
      board: fen,
      lastMove,
      san,
      check,
      maia_values,
    }
  })

  const maiaEvaluations = [] as { [rating: number]: MaiaEvaluation }[]

  const tree = buildGameTree(moves, moves[0].board)

  let currentNode: GameNode | null = tree.getRoot()

  for (let i = 0; i < moves.length; i++) {
    if (!currentNode) {
      break
    }

    const stockfishEval = stockfishEvaluations[i]
      ? convertMoveMapToStockfishEval(
          stockfishEvaluations[i],
          moves[i].board.split(' ')[1],
        )
      : undefined

    if (stockfishEval) {
      currentNode.addStockfishAnalysis(stockfishEval)
    }
    currentNode = currentNode?.mainChild
  }

  return {
    id,
    blackPlayer,
    whitePlayer,
    moves,
    maiaEvaluations,
    stockfishEvaluations,
    availableMoves,
    gameType,
    termination,
    tree,
  } as any as AnalyzedGame
}

export const getAnalyzedLichessGame = async (id: string, pgn: string) => {
  const res = await fetch(buildUrl('analysis/analyze_user_game'), {
    method: 'POST',
    body: pgn,
    headers: {
      'Content-Type': 'text/plain',
    },
  })

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  const data = await res.json()

  const termination = {
    ...data['termination'],
    condition: 'Normal',
  }

  const gameType = 'blitz'
  const blackPlayer = data['black_player'] as Player
  const whitePlayer = data['white_player'] as Player

  const maiaEvals: { [model: string]: MoveMap[] } = {}
  const positionEvaluations: { [model: string]: PositionEvaluation[] } = {}
  const availableMoves: AvailableMoves[] = []

  for (const model of data['maia_versions']) {
    maiaEvals[model] = data['maia_evals'][model]
    positionEvaluations[model] = Object.keys(data['maia_evals'][model]).map(
      () => ({
        trickiness: 1,
        performance: 1,
      }),
    )
  }

  for (const position of data['move_maps']) {
    const moves: AvailableMoves = {}
    for (const move of position) {
      const fromTo = move.move.join('')
      const san = move['move_san']
      const { check, fen } = move

      moves[fromTo] = {
        board: fen,
        check,
        san,
        lastMove: move.move,
      }
    }
    availableMoves.push(moves)
  }

  const gameStates = data['game_states']

  const moves = gameStates.map((gameState: any) => {
    const {
      last_move: lastMove,
      fen,
      check,
      last_move_san: san,
      evaluations: maia_values,
    } = gameState

    return {
      board: fen,
      lastMove,
      san,
      check,
      maia_values,
    }
  })

  const maiaEvaluations = [] as { [rating: number]: MaiaEvaluation }[]
  const stockfishEvaluations: StockfishEvaluation[] = []
  const tree = buildGameTree(moves, moves[0].board)

  return {
    id,
    blackPlayer,
    whitePlayer,
    moves,
    availableMoves,
    gameType,
    termination,
    maiaEvaluations,
    stockfishEvaluations,
    tree,
    type: 'brain',
    pgn,
  } as AnalyzedGame
}

const createAnalyzedGameFromPGN = async (
  pgn: string,
  id?: string,
): Promise<AnalyzedGame> => {
  const { Chess } = await import('chess.ts')
  const chess = new Chess()

  try {
    chess.loadPgn(pgn)
  } catch (error) {
    throw new Error('Invalid PGN format')
  }

  const history = chess.history({ verbose: true })
  const headers = chess.header()

  const moves = []
  const tempChess = new Chess()

  const startingFen =
    headers.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  if (headers.FEN) {
    tempChess.load(headers.FEN)
  }

  moves.push({
    board: tempChess.fen(),
    lastMove: undefined,
    san: undefined,
    check: tempChess.inCheck(),
    maia_values: {},
  })

  for (const move of history) {
    tempChess.move(move)
    moves.push({
      board: tempChess.fen(),
      lastMove: [move.from, move.to] as [string, string],
      san: move.san,
      check: tempChess.inCheck(),
      maia_values: {},
    })
  }

  const tree = buildGameTree(moves, startingFen)

  return {
    id: id || `custom-pgn-${Date.now()}`,
    blackPlayer: { name: headers.Black || 'Black', rating: undefined },
    whitePlayer: { name: headers.White || 'White', rating: undefined },
    moves,
    availableMoves: new Array(moves.length).fill({}),
    gameType: 'custom',
    termination: {
      result: headers.Result || '*',
      winner:
        headers.Result === '1-0'
          ? 'white'
          : headers.Result === '0-1'
            ? 'black'
            : 'none',
      condition: 'Normal',
    },
    maiaEvaluations: new Array(moves.length).fill({}),
    stockfishEvaluations: new Array(moves.length).fill(undefined),
    tree,
    type: 'custom-pgn' as const,
    pgn,
  } as AnalyzedGame
}

export const getAnalyzedCustomPGN = async (
  pgn: string,
  name?: string,
): Promise<AnalyzedGame> => {
  const { saveCustomAnalysis } = await import('src/lib/customAnalysis')

  const stored = saveCustomAnalysis('pgn', pgn, name)

  return createAnalyzedGameFromPGN(pgn, stored.id)
}

const createAnalyzedGameFromFEN = async (
  fen: string,
  id?: string,
): Promise<AnalyzedGame> => {
  const { Chess } = await import('chess.ts')
  const chess = new Chess()

  try {
    chess.load(fen)
  } catch (error) {
    throw new Error('Invalid FEN format')
  }

  const moves = [
    {
      board: fen,
      lastMove: undefined,
      san: undefined,
      check: chess.inCheck(),
      maia_values: {},
    },
  ]

  const tree = new GameTree(fen)

  return {
    id: id || `custom-fen-${Date.now()}`,
    blackPlayer: { name: 'Black', rating: undefined },
    whitePlayer: { name: 'White', rating: undefined },
    moves,
    availableMoves: [{}],
    gameType: 'custom',
    termination: {
      result: '*',
      winner: 'none',
      condition: 'Normal',
    },
    maiaEvaluations: [{}],
    stockfishEvaluations: [undefined],
    tree,
    type: 'custom-fen' as const,
  } as AnalyzedGame
}

export const getAnalyzedCustomFEN = async (
  fen: string,
  name?: string,
): Promise<AnalyzedGame> => {
  const { saveCustomAnalysis } = await import('src/lib/customAnalysis')

  const stored = saveCustomAnalysis('fen', fen, name)

  return createAnalyzedGameFromFEN(fen, stored.id)
}

export const getAnalyzedCustomGame = async (
  id: string,
): Promise<AnalyzedGame> => {
  const { getCustomAnalysisById } = await import('src/lib/customAnalysis')

  const stored = getCustomAnalysisById(id)
  if (!stored) {
    throw new Error('Custom analysis not found')
  }

  if (stored.type === 'custom-pgn') {
    return createAnalyzedGameFromPGN(stored.data, stored.id)
  } else {
    return createAnalyzedGameFromFEN(stored.data, stored.id)
  }
}

export const getAnalyzedUserGame = async (
  id: string,
  game_type: 'play' | 'hand' | 'brain',
) => {
  const res = await fetch(
    buildUrl(
      `analysis/user/analyze_user_maia_game/${id}?` +
        new URLSearchParams({
          game_type,
        }),
    ),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  )

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  const data = await res.json()

  const termination = {
    ...data['termination'],
    condition: 'Normal',
  }

  const gameType = 'blitz'
  const blackPlayer = data['black_player'] as Player
  const whitePlayer = data['white_player'] as Player

  const maiaPattern = /maia_kdd_1\d00/

  if (blackPlayer.name && maiaPattern.test(blackPlayer.name)) {
    blackPlayer.name = blackPlayer.name.replace('maia_kdd_', 'Maia ')
  }

  if (whitePlayer.name && maiaPattern.test(whitePlayer.name)) {
    whitePlayer.name = whitePlayer.name.replace('maia_kdd_', 'Maia ')
  }

  const maiaEvals: { [model: string]: MoveMap[] } = {}

  const availableMoves: AvailableMoves[] = []

  for (const model of data['maia_versions']) {
    maiaEvals[model] = data['maia_evals'][model]
  }

  for (const position of data['move_maps']) {
    const moves: AvailableMoves = {}
    for (const move of position) {
      const fromTo = move.move.join('')
      const san = move['move_san']
      const { check, fen } = move

      moves[fromTo] = {
        board: fen,
        check,
        san,
        lastMove: move.move,
      }
    }
    availableMoves.push(moves)
  }

  const gameStates = data['game_states']

  const moves = gameStates.map((gameState: any) => {
    const {
      last_move: lastMove,
      fen,
      check,
      last_move_san: san,
      evaluations: maia_values,
    } = gameState

    return {
      board: fen,
      lastMove,
      san,
      check,
      maia_values,
    }
  })

  const maiaEvaluations = [] as { [rating: number]: MaiaEvaluation }[]
  const stockfishEvaluations: StockfishEvaluation[] = []
  const tree = buildGameTree(moves, moves[0].board)

  return {
    id,
    blackPlayer,
    whitePlayer,
    moves,
    availableMoves,
    gameType,
    termination,
    maiaEvaluations,
    stockfishEvaluations,
    tree,
    type: 'brain',
  } as AnalyzedGame
}
