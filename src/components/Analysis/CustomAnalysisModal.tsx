import { useState } from 'react'
import { Chess } from 'chess.ts'
import toast from 'react-hot-toast'
import { ModalContainer } from '../Misc/ModalContainer'
import { CloseIcon } from '../Icons/icons'

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
      <div className="flex w-[700px] max-w-[90vw] flex-col gap-4">
        <div className="relative flex items-center justify-center">
          <h2 className="text-2xl font-bold">Custom Analysis</h2>
          <button
            className="absolute right-0 cursor-pointer border-none bg-none opacity-50 transition duration-200 hover:opacity-100"
            title="Close"
            onClick={onClose}
          >
            {CloseIcon}
          </button>
        </div>

        <p className="text-sm text-secondary">
          Import a chess game from PGN notation or analyze a specific position
          using FEN notation.
        </p>

        {/* Mode selector */}
        <div className="flex gap-2">
          <button
            className={`rounded px-4 py-2 transition duration-200 ${
              mode === 'pgn'
                ? 'bg-human-4 text-white'
                : 'bg-background-2 text-primary hover:bg-background-3'
            }`}
            onClick={() => setMode('pgn')}
          >
            Import PGN Game
          </button>
          <button
            className={`rounded px-4 py-2 transition duration-200 ${
              mode === 'fen'
                ? 'bg-human-4 text-white'
                : 'bg-background-2 text-primary hover:bg-background-3'
            }`}
            onClick={() => setMode('fen')}
          >
            Analyze Position (FEN)
          </button>
        </div>

        <div>
          <label
            htmlFor="analysis-name"
            className="mb-1 block text-sm font-medium"
          >
            Name (optional):
          </label>
          <input
            id="analysis-name"
            type="text"
            className="w-full rounded border border-background-3 bg-background-2 p-2 text-primary focus:border-human-4 focus:outline-none"
            placeholder="Enter a name for this analysis"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="analysis-data"
            className="mb-1 block text-sm font-medium"
          >
            {mode === 'pgn' ? 'PGN Data:' : 'FEN Position:'}
          </label>
          <textarea
            id="analysis-data"
            className="h-32 w-full rounded border border-background-3 bg-background-2 p-2 font-mono text-sm text-primary focus:border-human-4 focus:outline-none"
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
            className="rounded bg-background-2 px-3 py-1 text-xs text-secondary hover:bg-background-3"
            onClick={() => setInput(mode === 'pgn' ? examplePGN : exampleFEN)}
          >
            Use Example
          </button>
          <button
            className="rounded bg-background-2 px-3 py-1 text-xs text-secondary hover:bg-background-3"
            onClick={() => setInput('')}
          >
            Clear
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="rounded bg-background-2 px-4 py-2 text-primary transition duration-200 hover:bg-background-3"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="hover:bg-human-5 rounded bg-human-4 px-4 py-2 text-white transition duration-200"
            onClick={validateAndSubmit}
          >
            Analyze
          </button>
        </div>
      </div>
    </ModalContainer>
  )
}
