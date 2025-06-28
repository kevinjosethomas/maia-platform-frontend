import { COLORS } from './constants'

export const mockAnalysisData = {
  colorSanMapping: {
    e2e4: { san: 'e4', color: COLORS.good[0] },
    d2d4: { san: 'd4', color: COLORS.good[1] },
    g1f3: { san: 'Nf3', color: COLORS.ok[0] },
    b1c3: { san: 'Nc3', color: COLORS.blunder[0] },
  },
  moveEvaluation: {
    maia: {
      value: 0.52,
      policy: {
        e2e4: 0.35,
        d2d4: 0.28,
        g1f3: 0.18,
        b1c3: 0.12,
      },
    },
    stockfish: {
      sent: true,
      depth: 15,
      model_move: 'e2e4',
      model_optimal_cp: 25,
      cp_vec: {
        e2e4: 25,
        d2d4: 20,
        g1f3: 15,
        b1c3: 10,
      },
      cp_relative_vec: {
        e2e4: 0,
        d2d4: -5,
        g1f3: -10,
        b1c3: -15,
      },
    },
  },
  recommendations: {
    maia: [
      { move: 'e2e4', prob: 0.35 },
      { move: 'd2d4', prob: 0.28 },
      { move: 'g1f3', prob: 0.18 },
      { move: 'b1c3', prob: 0.12 },
    ],
    stockfish: [
      { move: 'e2e4', cp: 25, winrate: 0.52 },
      { move: 'd2d4', cp: 20, winrate: 0.51 },
      { move: 'g1f3', cp: 15, winrate: 0.5 },
      { move: 'b1c3', cp: 10, winrate: 0.49 },
    ],
  },
  movesByRating: [
    { rating: 1100, e2e4: 45, d2d4: 35, g1f3: 15, b1c3: 5 },
    { rating: 1300, e2e4: 40, d2d4: 38, g1f3: 18, b1c3: 4 },
    { rating: 1500, e2e4: 38, d2d4: 40, g1f3: 20, b1c3: 2 },
    { rating: 1700, e2e4: 35, d2d4: 42, g1f3: 21, b1c3: 2 },
    { rating: 1900, e2e4: 33, d2d4: 44, g1f3: 22, b1c3: 1 },
  ],
  moveMap: [
    { move: 'e2e4', x: -0.1, y: 45 },
    { move: 'd2d4', x: -0.2, y: 40 },
    { move: 'g1f3', x: -0.8, y: 20 },
    { move: 'b1c3', x: -1.2, y: 15 },
  ],
  blunderMeter: {
    goodMoves: {
      probability: 65,
      moves: [
        { move: 'e2e4', probability: 35 },
        { move: 'd2d4', probability: 30 },
      ],
    },
    okMoves: {
      probability: 25,
      moves: [
        { move: 'g1f3', probability: 18 },
        { move: 'b1c3', probability: 7 },
      ],
    },
    blunderMoves: {
      probability: 10,
      moves: [
        { move: 'h2h4', probability: 5 },
        { move: 'a2a4', probability: 5 },
      ],
    },
  },
  boardDescription:
    'This position offers multiple strategic options. Consider central control and piece development.',
}
