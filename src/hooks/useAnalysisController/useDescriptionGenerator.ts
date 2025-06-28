import { Chess, PieceSymbol } from 'chess.ts'

type StockfishEvals = Record<string, number>
type MaiaEvals = Record<string, number[]>

const A = 1
const B = 0.8
const EPS = 0.08

const winRate = (p: number) => 1 / (1 + Math.exp(-(p - A) / B))
const wdl = (p: number) => {
  const w = winRate(p)
  const l = winRate(-p)
  return { w, d: 1 - w - l }
}

export function describePosition(
  fen: string,
  sf: StockfishEvals,
  maia: MaiaEvals,
  whiteToMove: boolean,
  eps = EPS,
): string {
  const chess = new Chess(fen)

  const legal = new Set<string>()
  chess
    .moves({ verbose: true })
    .forEach((m) => legal.add(m.from + m.to + (m.promotion ?? '')))

  const moves = Object.keys(sf).filter((m) => legal.has(m))
  if (!moves.length) return 'No legal moves available.'

  const seval: Record<string, number> = {}
  moves.forEach((m) => {
    seval[m] = (whiteToMove ? 1 : 1) * sf[m]
  })

  const opt = moves.reduce((a, b) => (seval[a] > seval[b] ? a : b))
  const { w: wOpt, d: dOpt } = wdl(seval[opt])

  const good = moves.filter((m) => {
    const { w, d } = wdl(seval[m])
    return Math.abs(w - wOpt) <= eps && Math.abs(d - dOpt) <= eps
  })

  const nGood = good.length
  const abundance =
    nGood === 1 ? 'only one move' : nGood === 2 ? 'two moves' : 'several moves'

  const uciToSan = (uci: string): string => {
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length > 4 ? uci[4] : undefined
    const mv = chess.move({ from, to, promotion: promotion as PieceSymbol })
    const san = mv?.san ?? uci
    chess.undo()
    return san
  }

  const bestGoodMoves = [...good]
    .sort((a, b) => seval[b] - seval[a])
    .slice(0, 3)
  const moveList = bestGoodMoves.map(uciToSan).join(', ')
  const bestMoveSan = uciToSan(opt)

  const avgGood = good.reduce((s, m) => s + seval[m], 0) / nGood

  let outcome: string
  if (avgGood > 2.5) outcome = 'to cleanly win'
  else if (avgGood > 1.0) outcome = 'to win'
  else if (avgGood > 0.35) outcome = 'for an advantage'
  else if (avgGood >= -0.35) outcome = 'to keep the balance'
  else if (avgGood >= -1.0) outcome = 'to hold the position'
  else outcome = 'to stay in the game'

  let setLevels = 0
  let optLevels = 0
  let temptLevels = 0
  const temptCount: Record<string, number> = {}

  for (let lvl = 0; lvl < 9; lvl++) {
    const probs = moves
      .map((m) => [maia[m]?.[lvl] ?? 0, m] as [number, string])
      .sort((a, b) => b[0] - a[0])

    const [p1, m1] = probs[0]
    const [p2, m2] = probs[1] ?? [0, '']
    const [p3, m3] = probs[2] ?? [0, '']

    const inGood = good.includes(m1)
    if (inGood) setLevels++
    if (m1 === opt) optLevels++

    const nearTop = (prob: number) => p1 - prob <= eps
    const addTempt = (uci: string) => {
      temptCount[uci] = (temptCount[uci] ?? 0) + 1
      return true
    }

    const tempting =
      inGood &&
      ((m2 && !good.includes(m2) && nearTop(p2) && addTempt(m2)) ||
        (m3 && !good.includes(m3) && nearTop(p3) && addTempt(m3)))

    if (tempting) temptLevels++
  }

  const tier = (k: number) => (k <= 2 ? 0 : k <= 6 ? 1 : 2)
  const setTier = tier(setLevels)
  const optTier = tier(optLevels)

  const phrSet =
    setTier === 0
      ? 'hard for human players to find'
      : setTier === 1
        ? 'findable for skilled players'
        : 'straightforward for players across skill levels to find'

  let phrBest =
    optTier === 0
      ? 'hard for human players to find'
      : optTier === 1
        ? 'findable for skilled players'
        : 'straightforward for players across skill levels to find'

  if (optTier === 1 && optTier < setTier) phrBest = 'only ' + phrBest

  const verb = nGood === 1 ? 'is' : 'are'
  const pron = nGood === 1 ? 'it is' : 'they are'

  let temptText = ''
  const hasTempting = setLevels > 0 && temptLevels > setLevels / 2
  if (hasTempting) {
    const topTemptUci = Object.entries(temptCount).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0]
    const temptSan = topTemptUci ? uciToSan(topTemptUci) : ''
    temptText =
      temptSan !== ''
        ? ` There are also tempting alternatives, such as ${temptSan}.`
        : ' There are also tempting alternatives.'
    if (!(optTier < setTier) && setTier == 2) {
      temptText = ` However, there are tempting alternatives, such as ${temptSan}.`
    }
  }

  if (nGood === 1) {
    return `There ${verb} ${abundance} (${moveList}) ${outcome}, and ${pron} ${phrSet}.${temptText}`
  }

  if (optTier < setTier) {
    return `There ${verb} ${abundance} (${moveList}) ${outcome}, and ${pron} ${phrSet}, but the best move (${bestMoveSan}) is ${phrBest}.${temptText}`
  }

  return `There ${verb} ${abundance} (${moveList}) ${outcome}, and ${pron} ${phrSet}.${temptText}`
}
