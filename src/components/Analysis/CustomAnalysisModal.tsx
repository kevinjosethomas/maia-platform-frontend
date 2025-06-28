import { useState } from 'react'
import { Chess } from 'chess.ts'
import toast from 'react-hot-toast'
import { ModalContainer } from '../Misc/ModalContainer'

interface Props {
  onSubmit: (type: 'pgn' | 'fen', data: string, name?: string) => void
  onClose: () => void
}

export const CustomAnalysisModal: React.FC<Props> = ({ onSubmit, onClose }) => {
  const [mode, setMode] = useState<'pgn' | 'fen'>('pgn')
  const [input, setInput] = useState('')
  const [name, setName] = useState('')

  const validateAndSubmit = () => {
    if (!input.trim()) {
      toast.error('Please enter some data')
      return
    }

    if (mode === 'fen') {
      const chess = new Chess()
      const validation = chess.validateFen(input.trim())
      if (!validation.valid) {
        toast.error('Invalid FEN position: ' + validation.error)
        return
      }
    } else {
      try {
        const chess = new Chess()
        chess.loadPgn(input.trim())
      } catch (error) {
        toast.error('Invalid PGN format: ' + (error as Error).message)
        return
      }
    }

    onSubmit(mode, input.trim(), name.trim() || undefined)
  }

  const examplePGN = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8`
  const exampleFEN = `r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4`

  return (
    <ModalContainer dismiss={onClose}>
      <div className="flex h-[550px] w-[600px] max-w-[90vw] flex-col overflow-hidden rounded-lg bg-background-1">
        {/* Header */}
        <div className="relative border-b border-white/10 p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-primary">Custom Analysis</h2>
            <p className="text-xs text-secondary">
              Import a chess game from PGN notation or analyze a specific
              position using FEN notation
            </p>
          </div>
          <button
            className="absolute right-4 top-4 text-secondary transition-colors hover:text-primary"
            title="Close"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Mode selector */}
            <div>
              <label
                htmlFor="import-type-selector"
                className="mb-1 block text-sm font-medium text-primary"
              >
                Import Type:
              </label>
              <div id="import-type-selector" className="flex gap-2">
                <button
                  className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors ${
                    mode === 'pgn'
                      ? 'bg-human-4 text-white'
                      : 'bg-background-2 text-primary hover:bg-background-3'
                  }`}
                  onClick={() => setMode('pgn')}
                >
                  PGN Game
                </button>
                <button
                  className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors ${
                    mode === 'fen'
                      ? 'bg-human-4 text-white'
                      : 'bg-background-2 text-primary hover:bg-background-3'
                  }`}
                  onClick={() => setMode('fen')}
                >
                  FEN Position
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="analysis-name"
                className="mb-1 block text-sm font-medium text-primary"
              >
                Name (optional):
              </label>
              <input
                id="analysis-name"
                type="text"
                className="w-full rounded border border-background-3 bg-background-2 px-3 py-2 text-sm text-primary placeholder-secondary focus:border-human-4 focus:outline-none focus:ring-1 focus:ring-human-4"
                placeholder="Enter a name for this analysis"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="analysis-data"
                className="mb-1 block text-sm font-medium text-primary"
              >
                {mode === 'pgn' ? 'PGN Data:' : 'FEN Position:'}
              </label>
              <textarea
                id="analysis-data"
                className="h-32 w-full rounded border border-background-3 bg-background-2 px-3 py-2 font-mono text-sm text-primary placeholder-secondary focus:border-human-4 focus:outline-none focus:ring-1 focus:ring-human-4"
                placeholder={mode === 'pgn' ? examplePGN : exampleFEN}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-secondary">
                {mode === 'pgn'
                  ? 'Paste your PGN game notation here. Headers and variations are supported.'
                  : 'Enter a valid FEN position string. This will set up the board for analysis.'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="rounded bg-background-2 px-3 py-1 text-xs text-primary transition-colors hover:bg-background-3"
                onClick={() =>
                  setInput(mode === 'pgn' ? examplePGN : exampleFEN)
                }
              >
                Use Example
              </button>
              <button
                className="rounded bg-background-2 px-3 py-1 text-xs text-primary transition-colors hover:bg-background-3"
                onClick={() => setInput('')}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-white/10 p-4">
          <button
            className="flex-1 rounded bg-background-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-background-3"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded bg-human-4 py-2 text-sm font-medium text-white transition-colors hover:bg-human-4/80"
            onClick={validateAndSubmit}
          >
            Analyze
          </button>
        </div>
      </div>
    </ModalContainer>
  )
}
