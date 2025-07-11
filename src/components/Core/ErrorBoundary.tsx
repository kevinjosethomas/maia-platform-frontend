import Link from 'next/link'
import { Component } from 'react'
import Chessground from '@react-chess/chessground'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  isUnauthorized: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isUnauthorized: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    console.log('Error caught in getDerivedStateFromError:', error)
    return { hasError: true, error: error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('Error caught in componentDidCatch:', error, errorInfo)
    if (error.message === 'Unauthorized') {
      this.setState({ hasError: true, isUnauthorized: true, error })
    } else {
      this.setState({ hasError: true, isUnauthorized: false, error })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isUnauthorized) {
        return (
          <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-backdrop">
            <h2 className="text-3xl font-bold">Unauthorized Access</h2>
            <p>
              You do not have permission to view this content. Please log in.
            </p>
            <Link
              href="/"
              className="flex items-center justify-center rounded bg-human-3 px-8 py-2 transition duration-200 hover:bg-human-4"
              onClick={() => this.setState({ hasError: false })}
            >
              <span className="text-lg text-primary">
                Click here to go home
              </span>
            </Link>
          </div>
        )
      }

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-10 bg-backdrop">
          <div className="flex flex-col items-center gap-3">
            <div className="h-[90vh] w-[90vh] md:h-[40vh] md:w-[40vh]">
              <Chessground
                contained
                config={{
                  fen: 'rn1qkb1r/ppp1pBpp/5n2/4N3/8/2N5/PPPP1PPP/R1BbK2R b KQkq - 0 7',
                  check: 'black',
                }}
              />
            </div>
            <h2 className="text-3xl font-bold">
              Sorry, you encountered an Error
            </h2>
            <Link
              href="/"
              className="flex items-center justify-center rounded bg-human-3 px-8 py-2 transition duration-200 hover:bg-human-4"
              onClick={() => this.setState({ hasError: false })}
            >
              <span className="text-lg text-primary">
                Click here to go home
              </span>
            </Link>
          </div>
          <div className="mt-4 flex flex-col justify-center">
            <p>Please share this stack trace:</p>
            <code className="bg-background-1 p-2">
              {this.state.error?.toString()}
            </code>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
