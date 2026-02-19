import '@mantine/core/styles.css'
import { MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'
import { appTheme } from '@/shared/config/mantineTheme'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MantineProvider theme={appTheme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  )
}
