import type { SelectOption } from '@/features/home/types'

export const SportId = {
  Abseiling: 'abseiling',
  Archery: 'archery',
  AustralianFootball: 'australian_football',
  Baseball: 'baseball',
  Basketball: 'basketball',
  Bowls: 'bowls',
  Canoeing: 'canoeing',
  Cricket: 'cricket',
  Cycling: 'cycling',
  Equestrian: 'equestrian',
  FieldAthletics: 'field_athletics',
  FieldHockey: 'field_hockey',
  Fishing: 'fishing',
  Golf: 'golf',
  Horseback: 'horseback',
  Kayaking: 'kayaking',
  Running: 'running',
  Mtb: 'mtb',
  Netball: 'netball',
  Oztag: 'oztag',
  Pickleball: 'pickleball',
  Climbing: 'climbing',
  Rowing: 'rowing',
  RugbyLeague: 'rugby_league',
  RugbyUnion: 'rugby_union',
  Sailing: 'sailing',
  Shooting: 'shooting',
  Soccer: 'soccer',
  Softball: 'softball',
  Tennis: 'tennis',
  Touch: 'touch',
  Volleyball: 'volleyball',
  Walking: 'walking',
} as const

export type SportId = (typeof SportId)[keyof typeof SportId]

export const SPORT_OPTIONS: SelectOption[] = [
  { value: SportId.Abseiling, label: 'Abseiling' },
  { value: SportId.Archery, label: 'Archery' },
  { value: SportId.AustralianFootball, label: 'Australian football' },
  { value: SportId.Baseball, label: 'Baseball' },
  { value: SportId.Basketball, label: 'Basketball' },
  { value: SportId.Bowls, label: 'Bowls' },
  { value: SportId.Canoeing, label: 'Canoeing' },
  { value: SportId.Cricket, label: 'Cricket' },
  { value: SportId.Cycling, label: 'Cycling' },
  { value: SportId.Equestrian, label: 'Equestrian' },
  { value: SportId.FieldAthletics, label: 'Running (Athletics)' },
  { value: SportId.FieldHockey, label: 'Field hockey' },
  { value: SportId.Fishing, label: 'Fishing' },
  { value: SportId.Golf, label: 'Golf' },
  { value: SportId.Horseback, label: 'Horseback riding' },
  { value: SportId.Kayaking, label: 'Kayaking' },
  { value: SportId.Running, label: 'Long distance running' },
  { value: SportId.Mtb, label: 'Mountain biking' },
  { value: SportId.Netball, label: 'Netball' },
  { value: SportId.Oztag, label: 'Oztag' },
  { value: SportId.Pickleball, label: 'Pickleball' },
  { value: SportId.Climbing, label: 'Rock climbing' },
  { value: SportId.Rowing, label: 'Rowing' },
  { value: SportId.RugbyLeague, label: 'Rugby league' },
  { value: SportId.RugbyUnion, label: 'Rugby union' },
  { value: SportId.Sailing, label: 'Sailing' },
  { value: SportId.Shooting, label: 'Shooting' },
  { value: SportId.Soccer, label: 'Soccer' },
  { value: SportId.Softball, label: 'Softball' },
  { value: SportId.Tennis, label: 'Tennis' },
  { value: SportId.Touch, label: 'Touch football' },
  { value: SportId.Volleyball, label: 'Volleyball' },
  { value: SportId.Walking, label: 'Brisk walking' },
]

export const SPORT_VALUES: string[] = SPORT_OPTIONS.map((option) => option.value)

export const DEFAULT_SPORT_ID = SportId.Soccer

export const SPORT_IMAGE_BY_ID: Record<string, string> = SPORT_VALUES.reduce<Record<string, string>>(
  (acc, sportId) => {
    acc[sportId] = `/sports/${sportId}.webp`
    return acc
  },
  {},
)
