import { cpToWinrate } from 'src/utils/stockfish'
import { Chess, PieceSymbol } from 'chess.ts'

type StockfishEvals = Record<string, number>
type MaiaEvals = Record<string, number[]>

type DescriptionSegment =
  | { type: 'text'; content: string }
  | { type: 'move'; san: string; uci: string }

/* ---------------- phrase banks ---------------- */

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)]

const OUTCOME = {
  overwhelming: [
    'for an overwhelming winning advantage',
    'for a crushing advantage',
    'for a decisive winning advantage',
  ],
  win: ['to win', 'for a winning advantage', 'to maintain a winning advantage'],
  advantage: ['for an advantage', 'to gain an edge', 'to press for advantage'],
  balance: [
    'to keep the balance',
    'to maintain the balance',
    'to hold equality',
  ],
  hold: ['to hold the position', 'to defend the position', 'to hold on'],
  stay: ['to stay in the game', 'to stay afloat', 'to keep fighting'],
}

const FINDABILITY = {
  hard: [
    'hard for human players to find',
    'very tough for humans to spot',
    'challenging for most players to see',
  ],
  skilled: [
    'findable for skilled players',
    'within reach for experienced players',
    'doable for strong players',
  ],
  straight: [
    'straightforward for players across skill levels to find',
    'easy for players of all strengths to spot',
    'obvious to most players',
  ],
}

const CAREFUL = ['Tread carefully', 'Be alert', 'Stay sharp', 'Watch out']
const TEMPTING_INTRO = [
  'There',
  'Be careful, as there',
  'In this position there',
]
const TEMPT_WORD = ['tempting', 'enticing', 'natural-looking']

/* ---------------- constants & helpers ---------------- */

const EPS = 0.08 // "good move" window
const BLUNDER_GAP = 0.1 // win-rate drop that defines a blunder

const winRate = (p: number) => 1 / (1 + Math.exp(-(p - 1) / 0.8))
const wdl = (p: number) => {
  const w = winRate(p),
    l = winRate(-p)
  return { w, d: 1 - w - l }
}

/* ========================================================= */

export function describePosition(
  fen: string,
  sf: StockfishEvals,
  maia: MaiaEvals,
  whiteToMove: boolean,
): { segments: DescriptionSegment[] } {
  /* ---------- board ---------- */
  const chess = new Chess(fen)
  const legal = new Set<string>()
  chess
    .moves({ verbose: true })
    .forEach((m) => legal.add(m.from + m.to + (m.promotion ?? '')))

  const moves = Object.keys(sf).filter((m) => legal.has(m))
  if (!moves.length)
    return {
      segments: [{ type: 'text', content: 'No legal moves available.' }],
    }

  if (!whiteToMove) {
    sf = Object.fromEntries(Object.entries(sf).map(([m, v]) => [m, -v]))
  }

  /* ---------- evals (side-to-move) ---------- */
  const seval: Record<string, number> = {}
  for (const m of moves) seval[m] = sf[m]

  /* ---------- good moves ---------- */
  const opt = moves.reduce((a, b) => (seval[a] > seval[b] ? a : b))
  const { w: wOpt, d: dOpt } = wdl(seval[opt])

  const good = moves.filter((m) => {
    const { w, d } = wdl(seval[m])
    return Math.abs(w - wOpt) <= EPS && Math.abs(d - dOpt) <= EPS
  })

  const nGood = good.length
  const abundance =
    nGood === 1
      ? 'only one move'
      : nGood === 2
        ? 'two moves'
        : pick(['several moves', 'multiple moves', 'a few moves'])

  /* ---------- helpers ---------- */
  const uciToSan = (uci: string) => {
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4] as PieceSymbol | undefined,
    })
    const san = mv?.san ?? uci
    chess.undo()
    return san
  }

  const sortedGood = [...good].sort((a, b) => seval[b] - seval[a])
  const bestMoveSan = uciToSan(opt)

  /* ε/2 closeness check */
  let optCloseSecond = false
  if (sortedGood.length >= 2) {
    const second = sortedGood[1]
    const { w: w2, d: d2 } = wdl(seval[second])
    optCloseSecond =
      Math.abs(wOpt - w2) <= EPS / 2 && Math.abs(dOpt - d2) <= EPS / 2
  }

  const goodMovesList = sortedGood
    .slice(0, 3)
    .map((uci) => ({ san: uciToSan(uci), uci }))
  const goodMovesWithoutOpt = sortedGood
    .filter((m) => m !== opt)
    .slice(0, 3)
    .map((uci) => ({ san: uciToSan(uci), uci }))

  /* ---------- outcome wording ---------- */
  const avgGood = sortedGood.reduce((s, m) => s + seval[m], 0) / nGood
  const outcome =
    avgGood > 3
      ? pick(OUTCOME.overwhelming)
      : avgGood > 1.5
        ? pick(OUTCOME.win)
        : avgGood > 0.35
          ? pick(OUTCOME.advantage)
          : avgGood >= -0.35
            ? pick(OUTCOME.balance)
            : avgGood >= -1.5
              ? pick(OUTCOME.hold)
              : pick(OUTCOME.stay)

  /* ---------- Maia analysis ---------- */
  let setLv = 0,
    optLv = 0,
    temptLv = 0
  const temptCnt: Record<string, number> = {}
  const aggProb: Record<string, number> = {}

  for (let lvl = 0; lvl < 9; lvl++) {
    const probs = moves
      .map((m) => [maia[m]?.[lvl] ?? 0, m] as [number, string])
      .sort((a, b) => b[0] - a[0])

    const [p1, m1] = probs[0]
    const [p2, m2] = probs[1] ?? [0, '']
    const [p3, m3] = probs[2] ?? [0, '']

    if (good.includes(m1)) setLv++
    if (m1 === opt) optLv++

    for (const [p, m] of probs.slice(0, 4)) aggProb[m] = (aggProb[m] ?? 0) + p

    const nearTop = (pr: number) => p1 - pr <= EPS
    const add = (m: string) => {
      temptCnt[m] = (temptCnt[m] ?? 0) + 1
      return true
    }

    const nearBad =
      (m2 && !good.includes(m2) && nearTop(p2) && add(m2)) ||
      (m3 && !good.includes(m3) && nearTop(p3) && add(m3))

    if (nearBad) temptLv++
  }

  /* ---------- tiers ---------- */
  const tier = (k: number) => (k <= 2 ? 0 : k <= 6 ? 1 : 2)
  const setT = tier(setLv),
    optT = tier(optLv)
  const bestHarder = optT < setT && !optCloseSecond

  const phrSet =
    setT === 0
      ? pick(FINDABILITY.hard)
      : setT === 1
        ? pick(FINDABILITY.skilled)
        : pick(FINDABILITY.straight)

  let phrBest =
    optT === 0
      ? pick(FINDABILITY.hard)
      : optT === 1
        ? pick(FINDABILITY.skilled)
        : pick(FINDABILITY.straight)

  if (optT === 1 && bestHarder) phrBest = 'only ' + phrBest

  /* ---------- blunder detection (win-rate gap) ---------- */
  const optWR = cpToWinrate(seval[opt])
  const isBlunder = (m: string) => optWR - cpToWinrate(seval[m]) >= BLUNDER_GAP

  const topNonGood = Object.entries(aggProb)
    .filter(([m]) => !good.includes(m))
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const top4 = Object.entries(aggProb)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  let blunderMove: string | null = null
  if (topNonGood && isBlunder(topNonGood)) blunderMove = topNonGood
  else
    for (const [m, p] of top4)
      if (p > 0.15 && isBlunder(m)) {
        blunderMove = m
        break
      }

  /* ---------- treacherous 40 % ---------- */
  const total = Object.values(aggProb).reduce((s, p) => s + p, 0)
  const blunderMass = Object.entries(aggProb)
    .filter(([m]) => isBlunder(m))
    .reduce((s, [, p]) => s + p, 0)
  const treach = total && blunderMass / total > 0.4

  /* ---------- tail text ---------- */
  const verb = nGood === 1 ? 'is' : 'are'
  const pron = nGood === 1 ? 'it is' : 'they are'
  const prefix = setT === 2 && !bestHarder ? ', however' : ''
  const temptW = pick(TEMPT_WORD)

  let tailSegments: DescriptionSegment[] = []
  if (blunderMove && treach) {
    tailSegments = [
      {
        type: 'text',
        content: ` ${pick(CAREFUL)}${prefix}, this position is highly treacherous! It is easy to go astray with ${temptW} blunders like `,
      },
      { type: 'move', san: uciToSan(blunderMove), uci: blunderMove },
      { type: 'text', content: '.' },
    ]
  } else if (blunderMove) {
    tailSegments = [
      {
        type: 'text',
        content: ` ${pick(CAREFUL)}${prefix}! There is a ${temptW} blunder in this position: `,
      },
      { type: 'move', san: uciToSan(blunderMove), uci: blunderMove },
      { type: 'text', content: '.' },
    ]
  } else {
    const showTempt = setT < 2 || (setT === 2 && temptLv > 4)
    if (showTempt) {
      let temptUci =
        Object.entries(temptCnt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      if (!temptUci)
        temptUci =
          Object.entries(aggProb)
            .filter(([m]) => !good.includes(m))
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

      const intro = pick(TEMPTING_INTRO)
      if (temptUci) {
        tailSegments = [
          {
            type: 'text',
            content: ` ${intro}${prefix} are also ${temptW} alternatives, such as `,
          },
          { type: 'move', san: uciToSan(temptUci), uci: temptUci },
          { type: 'text', content: '.' },
        ]
      } else {
        tailSegments = [
          {
            type: 'text',
            content: ` ${intro}${prefix} are also ${temptW} alternatives.`,
          },
        ]
      }
    }
  }

  /* ---------- assemble ---------- */
  const segments: DescriptionSegment[] = []

  // Helper function to create move list segments
  const createMoveListSegments = (moveList: { san: string; uci: string }[]) => {
    const moveSegments: DescriptionSegment[] = []
    moveList.forEach((move, index) => {
      moveSegments.push({ type: 'move', san: move.san, uci: move.uci })
      if (index < moveList.length - 1) {
        moveSegments.push({ type: 'text', content: ', ' })
      }
    })
    return moveSegments
  }

  // Main description
  const moveList = bestHarder ? goodMovesWithoutOpt : goodMovesList

  if (nGood === 1) {
    segments.push(
      { type: 'text', content: `There ${verb} ${abundance} (` },
      ...createMoveListSegments(moveList),
      { type: 'text', content: `) ${outcome}, and ${pron} ${phrSet}.` },
    )
  } else if (bestHarder) {
    segments.push(
      { type: 'text', content: `There ${verb} ${abundance} (` },
      ...createMoveListSegments(moveList),
      {
        type: 'text',
        content: `) ${outcome}, and ${pron} ${phrSet}, but the best move (`,
      },
      { type: 'move', san: bestMoveSan, uci: opt },
      { type: 'text', content: `) is ${phrBest}.` },
    )
  } else {
    segments.push(
      { type: 'text', content: `There ${verb} ${abundance} (` },
      ...createMoveListSegments(moveList),
      { type: 'text', content: `) ${outcome}, and ${pron} ${phrSet}.` },
    )
  }

  // Add tail segments
  segments.push(...tailSegments)

  return { segments }
}
