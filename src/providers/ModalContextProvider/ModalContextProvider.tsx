import { ComponentProps, ReactNode, useState } from 'react'

import { ModalContext } from 'src/contexts'
import { PlaySetupModal } from 'src/components'

export const ModalContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  const [playSetupModalProps, setPlaySetupModalProps] = useState<
    ComponentProps<typeof PlaySetupModal> | undefined
  >(undefined)

  return (
    <ModalContext.Provider
      value={{
        playSetupModalProps,
        setPlaySetupModalProps,
      }}
    >
      {playSetupModalProps && <PlaySetupModal {...playSetupModalProps} />}
      {children}
    </ModalContext.Provider>
  )
}
