import { createTheme, rem } from '@mantine/core'

export const appTheme = createTheme({
  primaryColor: 'orange',
  fontFamily: 'Open Sans, Arial, sans-serif',
  headings: {
    fontFamily: 'Open Sans, Arial, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  spacing: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  colors: {
    brand: [
      '#fff1eb',
      '#ffe0d4',
      '#ffc3a7',
      '#ffa273',
      '#ff8045',
      '#f2652f',
      '#e15220',
      '#c73e12',
      '#a7320d',
      '#7f2309',
    ],
  },
})
