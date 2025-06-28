import Link from 'next/link'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocalStorage } from 'src/hooks'

interface Props {
  progress: number
  download: () => Promise<void>
}

export const DownloadModelModal: React.FC<Props> = ({
  progress,
  download,
}: Props) => {
  return (
    <motion.div
      className="absolute left-0 top-0 z-20 flex h-screen w-screen flex-col items-center justify-center bg-black/90 px-4 md:px-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        className="flex w-full flex-col gap-5 rounded-md border border-background-1 bg-backdrop p-5 md:w-[min(750px,50vw)] md:p-8"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl md:text-3xl">
            auto_awesome
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">
            Download Our New Model
          </h1>
        </div>
        <div className="flex flex-col gap-3 text-sm md:text-base">
          <p className="text-primary/80">
            Our newest model, Maia 2, provides richer and more in-depth
            analysis, allowing for:
          </p>
          <ul className="flex list-inside flex-col gap-1.5 pl-2 text-primary/80">
            <li>
              ✨ Detailed move evaluations tailored to different rating levels
            </li>
            <li>
              🧠 Insights into how players of various strengths approach the
              game
            </li>
            <li>
              ⚡ Faster, local analysis without needing to send data to a server
            </li>
          </ul>
          <p className="text-primary/80">
            Maia 2 will run entirely on your device but requires a one-time 90mb
            download.
          </p>
        </div>
        <div className="mt-6 flex w-full flex-col items-center justify-end gap-2 md:flex-row">
          {progress ? (
            <div className="relative order-3 flex h-8 w-full items-center justify-start overflow-hidden rounded bg-human-4/20 px-3 md:order-1 md:h-10 md:w-auto md:flex-1">
              <p className="z-10 text-xs text-primary md:text-base">
                {Math.round(progress)}%
              </p>
              <div
                className="absolute left-0 top-0 z-0 h-10 rounded-l bg-human-4/80"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          <Link
            href="/"
            className="order-2 flex h-8 cursor-pointer select-none items-center gap-1 self-end rounded bg-background-2 px-3 text-sm transition duration-200 hover:bg-background-3 md:order-3 md:h-10 md:px-4 md:text-base"
          >
            <p>Return Home</p>
          </Link>
          <div
            tabIndex={0}
            role="button"
            className="order-2 flex h-8 cursor-pointer select-none items-center gap-1 self-end rounded bg-human-4 px-3 text-sm transition duration-200 hover:bg-human-4/90 md:order-3 md:h-10 md:px-4 md:text-base"
            onClick={download}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                download()
              }
            }}
          >
            <span className="material-symbols-outlined text-lg md:text-xl">
              download
            </span>
            <p>
              Download Maia 2{' '}
              <span className="text-xs text-primary/60">(90mb)</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
