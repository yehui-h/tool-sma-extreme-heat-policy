import { parseAsString, parseAsStringEnum } from 'nuqs'
import { sportOptions } from '@/features/home/data/mockRisk'

export const VALID_SPORT_VALUES = sportOptions.map((option) => option.value)

export const HOME_QUERY_PARSERS = {
  sport: parseAsStringEnum(VALID_SPORT_VALUES),
  location: parseAsString,
}

export const HOME_QUERY_URL_KEYS = {
  location: 'loc',
} as const
