import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import { Open_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

import {
  AuthContextProvider,
  ModalContextProvider,
  ThemeContextProvider,
  WindowSizeContextProvider,
  AnalysisListContextProvider,
} from 'src/providers'
import { TourProvider as TourContextProvider } from 'src/contexts'
import 'src/styles/tailwind.css'
import 'react-tooltip/dist/react-tooltip.css'
import 'node_modules/chessground/assets/chessground.base.css'
import 'node_modules/chessground/assets/chessground.brown.css'
import 'node_modules/chessground/assets/chessground.cburnett.css'
import { Footer, Compose, ErrorBoundary, Header } from 'src/components'
import { TourManager } from 'src/components/Tour'

const OpenSans = Open_Sans({ subsets: ['latin'] })

function MaiaPlatform({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isAnalysisPage = router.pathname.startsWith('/analysis')

  return (
    <TourContextProvider>
      <TourManager />
      <Compose
        components={[
          ErrorBoundary,
          ThemeContextProvider,
          WindowSizeContextProvider,
          AuthContextProvider,
          ModalContextProvider,
          ...(isAnalysisPage ? [AnalysisListContextProvider] : []),
        ]}
      >
        <Head>
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          />
        </Head>
        <div className={`${OpenSans.className} app-container`}>
          <Header />
          <div className="content-container">
            <Component {...pageProps} />
          </div>
          <Footer />
        </div>
        <Toaster position="bottom-right" />
        <Analytics />
        <Script async src="/analytics.js?id=G-SNP84LXLKY" />
        <Script id="analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-SNP84LXLKY');
          `}
        </Script>
      </Compose>
    </TourContextProvider>
  )
}

export default MaiaPlatform
