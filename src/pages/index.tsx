import Head from 'next/head'
import type { NextPage } from 'next'
import React, { useCallback, useContext, useEffect, useRef } from 'react'

import { ModalContext } from 'src/contexts'
import {
  HomeHero,
  AboutMaia,
  PlaySection,
  AnalysisSection,
  TrainSection,
  AdditionalFeaturesSection,
  PageNavigation,
} from 'src/components'

const Home: NextPage = () => {
  const { setPlaySetupModalProps } = useContext(ModalContext)

  // Close play dialog if page closed
  useEffect(
    () => () => setPlaySetupModalProps(undefined),
    [setPlaySetupModalProps],
  )

  const featuresRef = useRef<HTMLDivElement>(null)

  const scrollHandler = useCallback(() => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [featuresRef])

  return (
    <>
      <Head>
        <title>Maia Chess</title>
        <meta
          name="description"
          content="Collection of chess training and analysis tools centered around Maia."
        />
      </Head>
      <HomeHero scrollHandler={scrollHandler} />
      <PageNavigation />
      <div ref={featuresRef}>
        <div className="bg-background-1">
          <PlaySection id="play-section" />
        </div>
        <div className="bg-background-2">
          <AnalysisSection id="analysis-section" />
        </div>
        <div className="bg-background-1">
          <TrainSection id="train-section" />
        </div>
        <div className="bg-background-2">
          <AdditionalFeaturesSection id="more-features" />
        </div>
        <AboutMaia />
      </div>
    </>
  )
}

export default Home
