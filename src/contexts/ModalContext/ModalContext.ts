import React, { ComponentProps } from 'react'

import { Modals } from 'src/types'
import { PlaySetupModal } from 'src/components'

const fn = () => {
  throw new Error('poorly provided ModalContext')
}

interface IModalContext {
  playSetupModalProps?: ComponentProps<typeof PlaySetupModal>
  setPlaySetupModalProps: (arg0?: ComponentProps<typeof PlaySetupModal>) => void
}

export const ModalContext = React.createContext<IModalContext>({
  setPlaySetupModalProps: fn,
})
