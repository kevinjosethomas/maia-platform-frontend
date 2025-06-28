import { NextPage } from 'next/types'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useMemo } from 'react'

import { startGame } from 'src/api'
import {
  Loading,
  GameplayInterface,
  HandBrainPlayControls,
} from 'src/components'
import { ModalContext } from 'src/contexts'
import { Color, PlayGameConfig, TimeControl } from 'src/types'
import { useHandBrainController } from 'src/hooks/usePlayController/useHandBrainController'
import { PlayControllerContext } from 'src/contexts/PlayControllerContext/PlayControllerContext'

interface Props {
  id: string
  playGameConfig: PlayGameConfig
  playAgain: () => void
}

const PlayHandBrain: React.FC<Props> = ({
  id,
  playGameConfig,
  playAgain,
}: Props) => {
  const controller = useHandBrainController(id, playGameConfig)

  return (
    <PlayControllerContext.Provider value={controller}>
      <GameplayInterface boardShapes={controller.boardShapes}>
        <HandBrainPlayControls
          playerActive={controller.playerActive}
          gameOver={!!controller.game.termination}
          isBrain={playGameConfig.isBrain}
          color={playGameConfig.player}
          movablePieceTypes={Array.from(controller.movablePieceTypes)}
          selectedPiece={controller.selectedPiece}
          selectPiece={controller.selectPiece}
          resign={() => controller.setResigned(true)}
          playAgain={playAgain}
        />
      </GameplayInterface>
    </PlayControllerContext.Provider>
  )
}

const PlayHandBrainPage: NextPage = () => {
  const { openedModals, setInstructionsModalProps: setInstructionsModalProps } =
    useContext(ModalContext)

  useEffect(() => {
    if (!openedModals.handAndBrain) {
      setInstructionsModalProps({ instructionsType: 'handAndBrain' })
    }
    return () => setInstructionsModalProps(undefined)
  }, [setInstructionsModalProps, openedModals.handAndBrain])

  const router = useRouter()

  const { setPlaySetupModalProps } = useContext(ModalContext)

  const {
    id,
    player,
    maiaVersion,
    maiaPartnerVersion,
    timeControl,
    isBrain,
    sampleMoves,
    simulateMaiaTime,
    startFen,
  } = router.query

  const playGameConfig: PlayGameConfig = useMemo(
    () => ({
      playType: 'handAndBrain',
      player: (player || 'white') as Color,
      maiaPartnerVersion: (maiaPartnerVersion || 'maia_kdd_1100') as string,
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
      maiaPartnerVersion,
      player,
      sampleMoves,
      simulateMaiaTime,
      timeControl,
    ],
  )

  const playAgain = useCallback(() => {
    setPlaySetupModalProps({ playType: 'handAndBrain' })
  }, [setPlaySetupModalProps])

  useEffect(() => {
    let canceled = false

    async function fetchGameId() {
      let response
      try {
        response = await startGame(
          playGameConfig.player,
          playGameConfig.maiaVersion,
          playGameConfig.isBrain ? 'brain' : 'hand',
          playGameConfig.sampleMoves,
          playGameConfig.timeControl,
          playGameConfig.maiaPartnerVersion,
        )
      } catch (e) {
        router.push('/401')
        return
      }
      const newGameId = response.gameId

      if (!canceled) {
        router.replace(
          {
            pathname: '/play/hb',
            query: {
              id: newGameId,
              ...playGameConfig,
            },
          },
          {
            pathname: '/play/hb',
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
    <PlayHandBrain
      id={id as string}
      playGameConfig={playGameConfig}
      playAgain={playAgain}
    />
  ) : (
    <Loading />
  )
}

export default PlayHandBrainPage
