import { ReactNode } from 'react'

import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  components: (React.FC<{ children: ReactNode }> | typeof ErrorBoundary)[]
  children: React.ReactNode
}

export const Compose = (props: Props) => {
  const { components = [], children } = props

  return (
    <>
      {components.reduceRight((acc, Comp) => {
        return <Comp>{acc}</Comp>
      }, children)}
    </>
  )
}
