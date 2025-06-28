import { Chess, Color } from 'chess.ts'
import { StockfishEvaluation, MaiaEvaluation } from '..'

// Constants for move classification based on winrate
export const MOVE_CLASSIFICATION = {
  BLUNDER_THRESHOLD: 0.1, // 10% winrate drop - Blunder moves
  INACCURACY_THRESHOLD: 0.05, // 5% winrate drop - Meh moves
  GOOD_MOVE_THRESHOLD: 0.05, // 5% winrate increase
  EXCELLENT_MOVE_THRESHOLD: 0.1, // 10% winrate increase
  MAIA_UNLIKELY_THRESHOLD: 0.1, // 10% or less Maia probability for a good move
  WINRATE_LOSS_GOOD_THRESHOLD: -0.02, // Maximum acceptable winrate loss for "good" unlikely move
}

interface NodeAnalysis {
  maia?: { [rating: string]: MaiaEvaluation }
  stockfish?: StockfishEvaluation
}

export class GameTree {
  private root: GameNode
  private headers: Map<string, string>

  constructor(initialFen: string) {
    this.root = new GameNode(initialFen)
    this.headers = new Map<string, string>()

    if (
      initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    ) {
      this.headers.set('SetUp', '1')
      this.headers.set('FEN', initialFen)
    }
  }

  setHeader(key: string, value: string): void {
    this.headers.set(key, value)
  }

  getHeader(key: string): string | undefined {
    return this.headers.get(key)
  }

  toPGN(): string {
    const chess = new Chess()

    if (this.root.fen !== chess.fen()) {
      chess.load(this.root.fen)
    }

    this.headers.forEach((value, key) => {
      chess.addHeader(key, value)
    })

    let complete = false
    let node = this.root
    while (!complete) {
      if (node.mainChild) {
        node = node.mainChild
        chess.move(node.san || node.move || '')
      } else {
        complete = true
      }
    }

    return chess.pgn()
  }

  getRoot(): GameNode {
    return this.root
  }

  getMainLine(): GameNode[] {
    return this.root.getMainLine()
  }

  addMainMove(
    node: GameNode,
    fen: string,
    move: string,
    san: string,
    activeModel?: string,
    time?: number,
  ): GameNode {
    return node.addChild(fen, move, san, true, activeModel, time)
  }

  addVariation(
    node: GameNode,
    fen: string,
    move: string,
    san: string,
    activeModel?: string,
    time?: number,
  ): GameNode {
    if (node.findVariation(move)) {
      return node.findVariation(move) as GameNode
    }
    return node.addChild(fen, move, san, false, activeModel, time)
  }

  toMoveArray(): string[] {
    const moves: string[] = []
    let node = this.root
    while (node.mainChild) {
      node = node.mainChild
      if (node.move) moves.push(node.move)
    }
    return moves
  }

  toTimeArray(): number[] {
    const times: number[] = []
    let node = this.root
    while (node.mainChild) {
      node = node.mainChild
      times.push(node.time || 0)
    }
    return times
  }

  addMoveToMainLine(moveUci: string, time?: number): GameNode | null {
    const mainLine = this.getMainLine()
    const lastNode = mainLine[mainLine.length - 1]

    const chess = new Chess(lastNode.fen)
    const result = chess.move(moveUci, { sloppy: true })

    if (result) {
      return this.addMainMove(
        lastNode,
        chess.fen(),
        moveUci,
        result.san,
        undefined,
        time,
      )
    }

    return null
  }

  addMovesToMainLine(moves: string[], times?: number[]): GameNode | null {
    let currentNode: GameNode | null = null

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const time = times?.[i]
      currentNode = this.addMoveToMainLine(move, time)
      if (!currentNode) {
        return null
      }
    }

    return currentNode
  }
}

export class GameNode {
  private _fen: string
  private _move: string | null
  private _san: string | null
  private _parent: GameNode | null
  private _children: GameNode[]
  private _mainChild: GameNode | null
  private _mainline: boolean
  private _analysis: NodeAnalysis
  private _turn: Color
  private _check: boolean
  private _blunder: boolean
  private _inaccuracy: boolean
  private _goodMove: boolean
  private _excellentMove: boolean
  private _bestMove: boolean
  private _moveNumber: number
  private _unlikelyGoodMove: boolean
  private _time: number | null

  private static readonly BLUNDER_THRESHOLD =
    MOVE_CLASSIFICATION.BLUNDER_THRESHOLD
  private static readonly INACCURACY_THRESHOLD =
    MOVE_CLASSIFICATION.INACCURACY_THRESHOLD
  private static readonly GOOD_MOVE_THRESHOLD =
    MOVE_CLASSIFICATION.GOOD_MOVE_THRESHOLD
  private static readonly EXCELLENT_MOVE_THRESHOLD =
    MOVE_CLASSIFICATION.EXCELLENT_MOVE_THRESHOLD
  private static readonly MAIA_UNLIKELY_THRESHOLD =
    MOVE_CLASSIFICATION.MAIA_UNLIKELY_THRESHOLD
  private static readonly WINRATE_LOSS_GOOD_THRESHOLD =
    MOVE_CLASSIFICATION.WINRATE_LOSS_GOOD_THRESHOLD

  constructor(
    fen: string,
    move: string | null = null,
    san: string | null = null,
    parent: GameNode | null = null,
    mainline = true,
    time: number | null = null,
  ) {
    this._fen = fen
    this._move = move
    this._san = san
    this._parent = parent
    this._children = []
    this._mainChild = null
    this._mainline = mainline
    this._analysis = {}
    this._blunder = false
    this._inaccuracy = false
    this._goodMove = false
    this._excellentMove = false
    this._bestMove = false
    this._unlikelyGoodMove = false
    this._turn = this.parseTurn(fen)
    this._check = fen.includes('+')
    this._moveNumber = this.parseMoveNumber(fen, this._turn)
    this._time = time
  }

  get fen(): string {
    return this._fen
  }
  get move(): string | null {
    return this._move
  }
  get san(): string | null {
    return this._san
  }
  get parent(): GameNode | null {
    return this._parent
  }
  get children(): GameNode[] {
    return this._children
  }
  get isMainline(): boolean {
    return this._mainline
  }
  get mainChild(): GameNode | null {
    return this._mainChild
  }
  get analysis(): NodeAnalysis {
    return this._analysis
  }
  get turn(): Color {
    return this._turn
  }
  get check(): boolean {
    return this._check
  }
  get blunder(): boolean {
    return this._blunder
  }
  get inaccuracy(): boolean {
    return this._inaccuracy
  }
  get goodMove(): boolean {
    return this._goodMove
  }
  get excellentMove(): boolean {
    return this._excellentMove
  }
  get bestMove(): boolean {
    return this._bestMove
  }
  get moveNumber(): number {
    return this._moveNumber
  }
  get unlikelyGoodMove(): boolean {
    return this._unlikelyGoodMove
  }
  get time(): number | null {
    return this._time
  }

  private parseTurn(fen: string): Color {
    const parts = fen.split(' ')
    return parts[1] as Color
  }

  private parseMoveNumber(fen: string, turn: string): number {
    const parts = fen.split(' ')
    return parseInt(parts[5]) - (turn === 'w' ? 1 : 0)
  }

  // Helper method to classify a move based on winrate
  private classifyMoveByWinrate(
    node: GameNode,
    move: string,
    stockfishEval: StockfishEvaluation,
    activeModel?: string,
  ): void {
    // Check if this is the best move
    const best_move = stockfishEval.model_move
    node._bestMove = move === best_move

    if (stockfishEval.winrate_loss_vec && stockfishEval.winrate_vec) {
      const winrate_loss = stockfishEval.winrate_loss_vec[move]

      // Classify based on winrate loss
      if (winrate_loss !== undefined) {
        node._blunder = winrate_loss <= -GameNode.BLUNDER_THRESHOLD
        node._inaccuracy =
          !node._blunder && winrate_loss <= -GameNode.INACCURACY_THRESHOLD

        // Check if this is potentially an unlikely good move (we'll confirm with Maia data if available)
        const isGoodStockfishEval =
          winrate_loss >= GameNode.WINRATE_LOSS_GOOD_THRESHOLD

        // If we already have Maia data in the PARENT node, check if this is an unlikely good move
        if (isGoodStockfishEval && this._analysis.maia && move) {
          node._unlikelyGoodMove = this.checkForUnlikelyGoodMove(
            move,
            activeModel,
          )
        }

        // For good/excellent moves, we need to compare to the average winrate
        // A move is good/excellent if it's better than the average of all moves
        const winrates = Object.values(stockfishEval.winrate_vec)
        if (winrates.length > 0) {
          const avgWinrate =
            winrates.reduce((a, b) => a + b, 0) / winrates.length
          const moveWinrate = stockfishEval.winrate_vec[move]

          if (moveWinrate !== undefined) {
            const winrateImprovement = moveWinrate - avgWinrate
            node._goodMove = winrateImprovement >= GameNode.GOOD_MOVE_THRESHOLD
            node._excellentMove =
              winrateImprovement >= GameNode.EXCELLENT_MOVE_THRESHOLD
          }
        }
      }
    } else {
      // Fallback to CP-based classification if winrate not available
      const relative_eval = stockfishEval.cp_relative_vec[move]
      node._blunder = relative_eval < -150
    }
  }

  // Helper method to check if a move is an unlikely good move based on Maia probability
  private checkForUnlikelyGoodMove(
    move: string,
    activeModel?: string,
  ): boolean {
    if (!this._analysis.maia) return false

    // Use the provided active model or fall back to first available
    const maiaKeys = Object.keys(this._analysis.maia)
    if (maiaKeys.length === 0) return false

    const activeRating =
      activeModel && maiaKeys.includes(activeModel) ? activeModel : maiaKeys[0]

    const maiaEval = this._analysis.maia[activeRating]
    if (maiaEval && maiaEval.policy && move in maiaEval.policy) {
      const probability = maiaEval.policy[move]
      // If the probability is below the threshold, consider it an unlikely move
      if (probability <= GameNode.MAIA_UNLIKELY_THRESHOLD) {
        return true
      }
    }
    return false
  }

  addChild(
    fen: string,
    move: string,
    san: string,
    mainline = false,
    activeModel?: string,
    time?: number,
  ): GameNode {
    const child = new GameNode(fen, move, san, this, mainline, time || null)
    this._children.push(child)
    if (mainline) {
      this._mainChild = child
    }

    if (
      this._analysis.stockfish &&
      this._analysis.stockfish.depth >= 13 &&
      move
    ) {
      this.classifyMoveByWinrate(
        child,
        move,
        this._analysis.stockfish,
        activeModel,
      )
    }

    return child
  }

  addMaiaAnalysis(
    maiaEval: { [rating: string]: MaiaEvaluation },
    activeModel?: string,
  ): void {
    this._analysis.maia = maiaEval

    // Check if any existing children could be unlikely good moves
    if (this._analysis.stockfish && this._analysis.stockfish.depth >= 13) {
      for (const child of this._children) {
        if (child.move) {
          const winrate_loss =
            this._analysis.stockfish.winrate_loss_vec?.[child.move]
          if (
            winrate_loss !== undefined &&
            winrate_loss >= GameNode.WINRATE_LOSS_GOOD_THRESHOLD
          ) {
            child._unlikelyGoodMove = this.checkForUnlikelyGoodMove(
              child.move,
              activeModel,
            )
          }
        }
      }
    }
  }

  addStockfishAnalysis(
    stockfishEval: StockfishEvaluation,
    activeModel?: string,
  ): void {
    this._analysis.stockfish = stockfishEval

    if (stockfishEval.depth >= 13) {
      for (const child of this._children) {
        if (child.move) {
          this.classifyMoveByWinrate(
            child,
            child.move,
            stockfishEval,
            activeModel,
          )
        }
      }
    }
  }

  getMainLine(): GameNode[] {
    if (!this._mainChild) {
      return [this]
    }
    return [this, ...this._mainChild.getMainLine()]
  }

  getVariations(): GameNode[] {
    return this._children.filter((child) => !child.isMainline)
  }

  findVariation(move: string): GameNode | null {
    return (
      this._children.find(
        (child) => child.move === move && !child.isMainline,
      ) || null
    )
  }

  getPath(): GameNode[] {
    if (!this._parent) {
      return [this]
    }

    return [...this._parent.getPath(), this]
  }

  removeVariation(move: string): boolean {
    const index = this._children.findIndex(
      (child) => child.move === move && !child.isMainline,
    )
    if (index !== -1) {
      this._children.splice(index, 1)
      return true
    }
    return false
  }

  removeAllChildren(): void {
    this._children = []
    this._mainChild = null
  }

  promoteVariation(move: string): boolean {
    const variation = this.findVariation(move)
    if (!variation) return false

    if (this._mainChild) {
      this._mainChild._mainline = false
    }

    this._mainChild = variation
    variation._mainline = true
    return true
  }

  // Set the time for this move
  setTime(time: number): void {
    this._time = time
  }
}
