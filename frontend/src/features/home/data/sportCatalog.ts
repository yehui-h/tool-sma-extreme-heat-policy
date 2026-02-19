import {
  SportType,
  toSportAssetName,
  type SportType as SportTypeValue,
} from "@/features/home/domain/sportType";
import type { SelectOption } from "@/features/home/types";

export const SPORT_OPTIONS: SelectOption<SportTypeValue>[] = [
  { value: SportType.Abseiling, label: "Abseiling" },
  { value: SportType.Archery, label: "Archery" },
  { value: SportType.AustralianFootball, label: "Australian football" },
  { value: SportType.Baseball, label: "Baseball" },
  { value: SportType.Basketball, label: "Basketball" },
  { value: SportType.Bowls, label: "Bowls" },
  { value: SportType.Canoeing, label: "Canoeing" },
  { value: SportType.Cricket, label: "Cricket" },
  { value: SportType.Cycling, label: "Cycling" },
  { value: SportType.Equestrian, label: "Equestrian" },
  { value: SportType.FieldAthletics, label: "Running (Athletics)" },
  { value: SportType.FieldHockey, label: "Field hockey" },
  { value: SportType.Fishing, label: "Fishing" },
  { value: SportType.Golf, label: "Golf" },
  { value: SportType.Horseback, label: "Horseback riding" },
  { value: SportType.Kayaking, label: "Kayaking" },
  { value: SportType.Running, label: "Long distance running" },
  { value: SportType.Mtb, label: "Mountain biking" },
  { value: SportType.Netball, label: "Netball" },
  { value: SportType.Oztag, label: "Oztag" },
  { value: SportType.Pickleball, label: "Pickleball" },
  { value: SportType.Climbing, label: "Rock climbing" },
  { value: SportType.Rowing, label: "Rowing" },
  { value: SportType.RugbyLeague, label: "Rugby league" },
  { value: SportType.RugbyUnion, label: "Rugby union" },
  { value: SportType.Sailing, label: "Sailing" },
  { value: SportType.Shooting, label: "Shooting" },
  { value: SportType.Soccer, label: "Soccer" },
  { value: SportType.Softball, label: "Softball" },
  { value: SportType.Tennis, label: "Tennis" },
  { value: SportType.Touch, label: "Touch football" },
  { value: SportType.Volleyball, label: "Volleyball" },
  { value: SportType.Walking, label: "Brisk walking" },
];

export const SPORT_VALUES: SportTypeValue[] = SPORT_OPTIONS.map(
  (option) => option.value,
);

export const DEFAULT_SPORT_TYPE = SportType.Soccer;

export const SPORT_IMAGE_BY_TYPE: Record<SportTypeValue, string> =
  SPORT_VALUES.reduce<Record<SportTypeValue, string>>(
    (acc, sportType) => {
      acc[sportType] = `/sports/${toSportAssetName(sportType)}.webp`;
      return acc;
    },
    {} as Record<SportTypeValue, string>,
  );
