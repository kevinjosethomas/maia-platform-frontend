import { startGame } from 'src/api'
import { NextPage } from 'next/types'
import { useRouter } from 'next/router'
import { ModalContext, useTour } from 'src/contexts'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Loading, PlayControls } from 'src/components'
import { Color, TimeControl, PlayGameConfig } from 'src/types'
import { GameplayInterface } from 'src/components/Board/GameplayInterface'
import { useVsMaiaPlayController } from 'src/hooks/usePlayController/useVsMaiaController'
import { PlayControllerContext } from 'src/contexts/PlayControllerContext/PlayControllerContext'
import { tourConfigs } from 'src/config/tours'

interface Props {
  id: string
  playGameConfig: PlayGameConfig
  playAgain: () => void
}

const PlayMaia: React.FC<Props> = ({
  id,
  playGameConfig,
  playAgain,
}: Props) => {
  const controller = useVsMaiaPlayController(id, playGameConfig)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controller.playerActive || controller.game.termination) return

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          break
        case 'ArrowLeft':
          event.preventDefault()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [controller.playerActive, controller.game.termination])

  return (
    <PlayControllerContext.Provider value={controller}>
      <GameplayInterface>
        <div id="play-controls">
          <PlayControls
            game={controller.game}
            playerActive={controller.playerActive}
            gameOver={!!controller.game.termination}
            resign={
              controller.playerActive
                ? () => {
                    controller.updateClock()
                    controller.setResigned(true)
                  }
                : undefined
            }
            playAgain={playAgain}
          />
        </div>
      </GameplayInterface>
    </PlayControllerContext.Provider>
  )
}

const PlayMaiaPage: NextPage = () => {
  const { startTour, tourState } = useTour()
  const [initialTourCheck, setInitialTourCheck] = useState(false)

  useEffect(() => {
    if (!initialTourCheck && tourState.ready) {
      setInitialTourCheck(true)
      startTour(tourConfigs.play.id, tourConfigs.play.steps, false)
    }
  }, [initialTourCheck, startTour, tourState.ready])

  const router = useRouter()

  const { setPlaySetupModalProps } = useContext(ModalContext)

  const {
    id,
    player,
    maiaVersion,
    timeControl,
    isBrain,
    sampleMoves,
    simulateMaiaTime,
    startFen,
  } = router.query

  const playGameConfig: PlayGameConfig = useMemo(
    () => ({
      playType: 'againstMaia',
      player: (player || 'white') as Color,
      maiaVersion: (maiaVersion || 'maia_kdd_1100') as string,
      timeControl: (timeControl || 'unlimited') as TimeControl,
      isBrain: isBrain == 'true',
      sampleMoves: sampleMoves == 'true',
      simulateMaiaTime: simulateMaiaTime == 'true',
      startFen: typeof startFen == 'string' ? startFen : undefined,
    }),
    [
      startFen,
      isBrain,
      maiaVersion,
      player,
      sampleMoves,
      simulateMaiaTime,
      timeControl,
    ],
  )

  useEffect(() => {
    if (!initialTourCheck) {
      setInitialTourCheck(true)
      // Always attempt to start the tour - the tour context will handle completion checking
      startTour(tourConfigs.play.id, tourConfigs.play.steps, false)
    }
  }, [initialTourCheck, startTour])

  useEffect(() => {
    let canceled = false

    async function fetchGameId() {
      let response
      try {
        response = await startGame(
          playGameConfig.player,
          playGameConfig.maiaVersion,
          'play',
          playGameConfig.sampleMoves,
          playGameConfig.timeControl,
          undefined,
        )
      } catch (e) {
        router.push('/401')
        return
      }
      const newGameId = response.gameId

      if (!canceled) {
        router.replace(
          {
            pathname: '/play/maia',
            query: {
              id: newGameId,
              ...playGameConfig,
            },
          },
          {
            pathname: '/play/maia',
            query: {
              // We don't show the game ID in the address bar
              // so that if the page is manually refreshed
              // the old game ID is not persisted
              ...playGameConfig,
            },
          },
        )
      }
    }

    if (!id) {
      fetchGameId()

      return () => {
        canceled = true
      }
    }
  }, [id, playGameConfig, router])

  return router.isReady && id ? (
    <PlayMaia
      id={id as string}
      playGameConfig={playGameConfig}
      playAgain={() => setPlaySetupModalProps({ ...playGameConfig })}
    />
  ) : (
    <Loading />
  )
}

export default PlayMaiaPage
