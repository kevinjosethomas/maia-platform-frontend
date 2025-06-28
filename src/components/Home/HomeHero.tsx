import Link from 'next/link'
import { motion } from 'framer-motion'
import { Fragment, useCallback, useContext, useEffect, useState } from 'react'

import {
  SunIcon,
  UserIcon,
  ArrowIcon,
  TuringIcon,
  TrainIcon,
  RegularPlayIcon,
  ChessboardIcon,
  StarIcon,
} from 'src/components/Icons/icons'
import { PlayType } from 'src/types'
import { getGlobalStats } from 'src/api'
import { AuthContext, ModalContext } from 'src/contexts'
import { AnimatedNumber } from 'src/components/Misc/AnimatedNumber'

interface Props {
  scrollHandler: () => void
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
  href?: string
  external?: boolean
  index: number
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onClick,
  href,
  external,
  index,
}) => {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (onClick) {
      return (
        <button onClick={onClick} className="w-full">
          {children}
        </button>
      )
    }
    if (href) {
      if (external) {
        return (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        )
      }
      return <Link href={href}>{children}</Link>
    }
    return <>{children}</>
  }

  return (
    <CardWrapper>
      <motion.div
        className="flex h-full min-h-[140px] cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-md border-none bg-background-2 p-4 text-center hover:bg-human-4/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.2 + index * 0.1,
          ease: 'easeOut',
        }}
        whileHover={{
          scale: 1.03,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: { duration: 0.2 },
        }}
      >
        <motion.div
          className="w-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.3,
            delay: 0.3 + index * 0.1,
          }}
        >
          {icon}
        </motion.div>
        <div className="flex flex-col">
          <motion.h2
            className="text-lg font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.4 + index * 0.1,
            }}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.5 + index * 0.1,
            }}
          >
            {description}
          </motion.p>
        </div>
      </motion.div>
    </CardWrapper>
  )
}

export const HomeHero: React.FC<Props> = ({ scrollHandler }: Props) => {
  const [globalStats, setGlobalStats] = useState<{
    play_moves_total: number
    puzzle_games_total: number
    turing_games_total: number
  }>()
  const { setPlaySetupModalProps } = useContext(ModalContext)
  const { user, connectLichess } = useContext(AuthContext)

  const startGame = useCallback(
    (playType: PlayType) => {
      setPlaySetupModalProps({ playType: playType })
    },
    [setPlaySetupModalProps],
  )

  useEffect(() => {
    ;(async () => {
      const data = await getGlobalStats()
      setGlobalStats(data)
    })()
  }, [])

  return (
    <Fragment>
      <BetaBlurb />
      <div className="relative flex flex-col items-center justify-center gap-14 overflow-hidden pb-12 pt-8 md:pb-16 md:pt-20">
        <div className="z-10 flex w-full max-w-[1200px] flex-col items-center justify-center gap-10 p-4 text-left md:flex-row md:gap-20">
          <div className="flex w-full flex-col items-start justify-center gap-6 md:w-[40%] md:gap-8">
            <div className="flex flex-col gap-3 md:gap-4">
              <motion.h1
                className="text-4xl font-bold leading-tight md:text-5xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                A human-like chess engine
              </motion.h1>
              <motion.p
                className="text-xl text-primary/80 md:text-2xl"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              >
                Maia is a neural network chess engine with a more human-like
                style, trained from online human games.
              </motion.p>
            </div>
            <motion.div
              className="flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            >
              <motion.button
                className="flex items-center justify-center gap-2 rounded-md bg-human-4 px-6 py-3 text-white hover:bg-opacity-90"
                onClick={scrollHandler}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <p>Learn More</p>
                <i className="h-4">{ArrowIcon}</i>
              </motion.button>
              {!user?.lichessId && (
                <motion.button
                  className="flex items-center justify-center gap-2 rounded-md border border-background-2 bg-background-1 px-6 py-3 hover:bg-background-2"
                  onClick={() => connectLichess()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Connect with Lichess
                </motion.button>
              )}
            </motion.div>
          </div>
          <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<RegularPlayIcon />}
              title="Play Maia"
              description="Play chess against the human-like Maia engine"
              {...(user?.lichessId
                ? { onClick: () => startGame('againstMaia') }
                : { href: 'https://lichess.org/@/maia1', external: true })}
              index={0}
            />
            <FeatureCard
              icon={<ChessboardIcon />}
              title="Analysis"
              description="Analyze games with Maia's human-like insights"
              href="/analysis"
              index={1}
            />
            <FeatureCard
              icon={<TrainIcon />}
              title="Train"
              description="Improve your skills with Maia's training puzzles"
              href="/train"
              index={2}
            />
            <FeatureCard
              icon={<TuringIcon />}
              title="Hand & Brain"
              description="Play a collaborative chess variant with Maia"
              onClick={() => startGame('handAndBrain')}
              index={3}
            />
            <FeatureCard
              icon={<StarIcon />}
              title="Openings"
              description="Learn and practice chess openings with Maia"
              href="/openings"
              index={4}
            />
            <FeatureCard
              icon={<TuringIcon />}
              title="Bot-or-Not"
              description="Distinguish between human and AI play"
              href="/turing"
              index={5}
            />
          </div>
        </div>
        <motion.div
          className="grid grid-cols-3 gap-6 px-2 md:flex"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-center text-base text-primary/80">
            <AnimatedNumber
              value={globalStats?.play_moves_total || 0}
              className="font-bold"
            />{' '}
            moves played
          </p>
          <p className="text-center text-base text-primary/80">
            <AnimatedNumber
              value={globalStats?.puzzle_games_total || 0}
              className="font-bold"
            />{' '}
            puzzle games solved
          </p>
          <p className="text-center text-base text-primary/80">
            <AnimatedNumber
              value={globalStats?.turing_games_total || 0}
              className="font-bold"
            />{' '}
            turing games played
          </p>
        </motion.div>
      </div>
    </Fragment>
  )
}

function BetaBlurb() {
  const { user, connectLichess } = useContext(AuthContext)

  return (
    <div className="mt-2 flex items-center justify-center md:mt-8">
      {user?.lichessId ? (
        <motion.div
          className="flex flex-row items-center gap-3 bg-human-4 p-2 px-6 transition md:mt-0 md:rounded-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="*:h-5 *:w-5">{SunIcon}</div>
          <p>
            Maia Chess is in private beta. Join our Discord community{' '}
            <a
              target="_blank"
              rel="noreferrer"
              className="underline"
              href="https://discord.gg/Az93GqEAs7"
            >
              here
            </a>
            .
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-row items-center gap-3 bg-human-4 p-2 px-6 transition md:mt-0 md:rounded-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="*:h-5 *:w-5">{SunIcon}</div>
          <p>
            Maia Chess is in private beta. Sign up{' '}
            <a
              target="_blank"
              rel="noreferrer"
              className="underline"
              href="https://forms.gle/VAUKap4uwMGXJH3N8"
            >
              here
            </a>{' '}
            and sign in with{' '}
            <button onClick={connectLichess} className="underline">
              Lichess
            </button>
            .
          </p>
        </motion.div>
      )}
    </div>
  )
}
